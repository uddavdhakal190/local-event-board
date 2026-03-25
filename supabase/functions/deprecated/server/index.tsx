// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { seedEvents } from "./seed-data.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: ["http://localhost:5173", "https://eventgo.vercel.app"], // Simple list of allowed websites
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

/* ── Helper: get authenticated user from request ── */
async function getAuthUser(c: any): Promise<{ id: string; email: string } | null> {
  try {
    // Only use X-User-Token for user authentication
    // The Authorization header contains the publicAnonKey (service-level JWT without sub claim)
    // and must NOT be used for user validation
    const userToken = c.req.header("X-User-Token");
    if (!userToken) return null;
    const accessToken = userToken;

    // Use SERVICE_ROLE_KEY for reliable server-side JWT validation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    // Retry up to 3 times on transient network errors (connection reset, etc.)
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (error || !user) {
          console.error('Auth error validating user token:', error?.message || 'No user returned');
          return null;
        }
        return { id: user.id, email: user.email || "" };
      } catch (fetchErr: any) {
        lastError = fetchErr;
        const isTransient = fetchErr?.message?.includes('connection reset') ||
          fetchErr?.message?.includes('connection error') ||
          fetchErr?.message?.includes('SendRequest') ||
          fetchErr?.cause?.message?.includes('connection reset');
        if (!isTransient || attempt === 2) {
          throw fetchErr;
        }
        console.log(`Auth fetch attempt ${attempt + 1} failed (transient), retrying in ${(attempt + 1) * 200}ms...`);
        await new Promise(r => setTimeout(r, (attempt + 1) * 200));
      }
    }
    throw lastError;
  } catch (err) {
    console.error('Exception in getAuthUser:', err);
    return null;
  }
}

/* ── Helper: check if a user is admin ── */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const adminList: any = await kv.get("admin_users");
    if (!adminList || !Array.isArray(adminList)) return false;
    return adminList.includes(userId);
  } catch (_err) {
    return false;
  }
}

// Health check endpoint
app.get("/make-server-ccc6c9e2/health", async (c) => {
  const startTime = Date.now();
  const checks = {
    server: false,
    database: false,
    auth: false,
  };
  
  try {
    // Server is responsive (if we got here)
    checks.server = true;

    // Check KV store accessibility
    try {
      await kv.get("health_check_test");
      checks.database = true;
    } catch (err) {
      console.error('Health check: KV store error:', err);
    }

    // Check Supabase Auth service
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL"),
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      );
      const { error } = await supabase.auth.getSession();
      // If no error, auth service is reachable
      checks.auth = !error;
    } catch (err) {
      console.error('Health check: Auth service error:', err);
    }

    const responseTime = Date.now() - startTime;
    const allHealthy = checks.server && checks.database && checks.auth;

    return c.json({
      status: allHealthy ? "operational" : "degraded",
      checks,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check critical error:', err);
    return c.json({
      status: "down",
      checks,
      error: String(err),
      timestamp: new Date().toISOString(),
    }, 503);
  }
});

// ─── Check if current user is admin ───
app.get("/make-server-ccc6c9e2/auth/me", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ isAdmin: false, user: null });
    }
    const admin = await isAdmin(user.id);
    return c.json({ isAdmin: admin, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.log(`Error in /auth/me: ${err}`);
    return c.json({ isAdmin: false, user: null });
  }
});

// ─── Check if any admin exists (public) ───
app.get("/make-server-ccc6c9e2/auth/admin-exists", async (c) => {
  try {
    const adminList: any = await kv.get("admin_users");
    const exists = Array.isArray(adminList) && adminList.length > 0;
    return c.json({ success: true, exists });
  } catch (err) {
    console.log(`Error in /auth/admin-exists: ${err}`);
    return c.json({ error: "Failed to check admin existence" }, 500);
  }
});

// ─── Promote a user to admin (only existing admins can do this, or first-time setup) ───
app.post("/make-server-ccc6c9e2/auth/promote-admin", async (c) => {
  try {
    const requestingUser = await getAuthUser(c);
    const { userId, email } = await c.req.json();

    // Get current admin list
    let adminList: string[] = (await kv.get("admin_users")) || [];
    if (!Array.isArray(adminList)) adminList = [];

    // If admin list is empty, allow first admin setup (only if requesting user is authenticated)
    if (adminList.length === 0) {
      if (!requestingUser) {
        return c.json({ error: "Authentication required for first admin setup" }, 401);
      }
      adminList.push(requestingUser.id);
      await kv.set("admin_users", adminList);
      console.log(`First admin created: ${requestingUser.id} (${requestingUser.email})`);
      return c.json({ success: true, message: "You are now the first admin!" });
    }

    // Otherwise, only existing admins can promote
    if (!requestingUser || !adminList.includes(requestingUser.id)) {
      return c.json({ error: "Only admins can promote other users" }, 403);
    }

    // Find target user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const found = users?.find((u: any) => u.email === email);
      if (!found) return c.json({ error: `User not found with email: ${email}` }, 404);
      targetUserId = found.id;
    }

    if (!targetUserId) {
      return c.json({ error: "userId or email is required" }, 400);
    }

    if (!adminList.includes(targetUserId)) {
      adminList.push(targetUserId);
      await kv.set("admin_users", adminList);
    }

    console.log(`User promoted to admin: ${targetUserId}`);
    return c.json({ success: true, message: "User promoted to admin" });
  } catch (err) {
    console.log(`Error promoting admin: ${err}`);
    return c.json({ error: `Failed to promote admin: ${err}` }, 500);
  }
});

// ─── Remove admin role ───
app.post("/make-server-ccc6c9e2/auth/demote-admin", async (c) => {
  try {
    const requestingUser = await getAuthUser(c);
    if (!requestingUser) return c.json({ error: "Authentication required" }, 401);

    const isReqAdmin = await isAdmin(requestingUser.id);
    if (!isReqAdmin) return c.json({ error: "Only admins can demote other admins" }, 403);

    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: "userId is required" }, 400);

let adminList: any = await kv.get("admin_users");
      if (!Array.isArray(adminList)) adminList = [];
    adminList = adminList.filter((id: string) => id !== userId);
    await kv.set("admin_users", adminList);

    console.log(`User demoted from admin: ${userId}`);
    return c.json({ success: true, message: "Admin role removed" });
  } catch (err) {
    console.log(`Error demoting admin: ${err}`);
    return c.json({ error: `Failed to demote admin: ${err}` }, 500);
  }
});

// ─── Claim admin (first-time setup — if no admins exist, the logged-in user becomes admin) ───
app.post("/make-server-ccc6c9e2/auth/claim-admin", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    let adminList: string[] = (await kv.get("admin_users")) || [];
    if (!Array.isArray(adminList)) adminList = [];

    // If user is already admin
    if (adminList.includes(user.id)) {
      return c.json({ success: true, message: "You are already an admin" });
    }

    // Only allow claiming if no admins exist yet
    if (adminList.length > 0) {
      return c.json({ error: "Admin already exists. Ask an existing admin to promote you." }, 403);
    }

    adminList.push(user.id);
    await kv.set("admin_users", adminList);
    console.log(`First admin claimed: ${user.id} (${user.email})`);
    return c.json({ success: true, message: "You are now the first admin!" });
  } catch (err) {
    console.log(`Error claiming admin: ${err}`);
    return c.json({ error: `Failed to claim admin: ${err}` }, 500);
  }
});

// ─── List all users with admin status (admin-only) ───
app.get("/make-server-ccc6c9e2/auth/users", async (c) => {
  try {
    const requestingUser = await getAuthUser(c);
    if (!requestingUser) {
      return c.json({ error: "Authentication required" }, 401);
    }
    const adminCheck = await isAdmin(requestingUser.id);
    if (!adminCheck) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log(`Error listing users: ${error.message}`);
      return c.json({ error: `Failed to list users: ${error.message}` }, 500);
    }

    const adminList: string[] = (await kv.get("admin_users")) || [];

    const mapped = (users || []).map((u: any) => ({
      id: u.id,
      email: u.email || "",
      name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || "User",
      avatar: u.user_metadata?.avatar_url || null,
      isAdmin: Array.isArray(adminList) && adminList.includes(u.id),
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
    }));

    // Sort: admins first, then by creation date
    mapped.sort((a: any, b: any) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`Listed ${mapped.length} users for admin ${requestingUser.email}`);
    return c.json({ success: true, users: mapped });
  } catch (err) {
    console.log(`Error listing users: ${err}`);
    return c.json({ error: `Failed to list users: ${err}` }, 500);
  }
});

// ─── Update event status (approve / reject) ───
app.put("/make-server-ccc6c9e2/events/:id/status", async (c) => {
  try {
    // Admin-only route
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required to update event status" }, 401);
    }
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return c.json({ error: "Admin access required to update event status" }, 403);
    }

    const id = c.req.param("id");
    const { status } = await c.req.json();

    if (!status || !["approved", "rejected", "pending_review"].includes(status)) {
      return c.json({ error: "Invalid status. Must be 'approved', 'rejected', or 'pending_review'" }, 400);
    }

    const event = await kv.get(id);
    if (!event) {
      return c.json({ error: `Event not found: ${id}` }, 404);
    }

    event.status = status;
    event.reviewedAt = new Date().toISOString();
    event.reviewedBy = user.id;
    await kv.set(id, event);

    console.log(`Event ${id} status updated to: ${status} by admin ${user.email}`);
    return c.json({ success: true, event });
  } catch (err) {
    console.log(`Error updating event status ${c.req.param("id")}: ${err}`);
    return c.json({ error: `Failed to update event status: ${err}` }, 500);
  }
});

// ─── Delete an event by ID ───
app.delete("/make-server-ccc6c9e2/events/:id", async (c) => {
  try {
    // Admin-only route
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required to delete events" }, 401);
    }
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return c.json({ error: "Admin access required to delete events" }, 403);
    }

    const id = c.req.param("id");
    await kv.del(id);
    console.log(`Event deleted: ${id} by admin ${user.email}`);
    return c.json({ success: true, message: "Event deleted" });
  } catch (err) {
    console.log(`Error deleting event ${c.req.param("id")}: ${err}`);
    return c.json({ error: `Failed to delete event: ${err}` }, 500);
  }
});

// ─ Remove a user entirely (admin-only) ───
app.post("/make-server-ccc6c9e2/auth/remove-user", async (c) => {
  try {
    const requestingUser = await getAuthUser(c);
    if (!requestingUser) return c.json({ error: "Authentication required" }, 401);

    const adminCheck = await isAdmin(requestingUser.id);
    if (!adminCheck) return c.json({ error: "Admin access required to remove users" }, 403);

    const { userId } = await c.req.json();
    if (!userId) return c.json({ error: "userId is required" }, 400);

    // Prevent removing yourself
    if (userId === requestingUser.id) {
      return c.json({ error: "You cannot remove your own account from the admin panel" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    // Also remove from admin list if they were an admin
      let adminList: any = await kv.get("admin_users");
      if (!Array.isArray(adminList)) adminList = [];
      if (adminList.includes(userId)) {
        adminList = adminList.filter((id: string) => id !== userId);
        await kv.set("admin_users", adminList);
        console.log(`Removed user ${userId} from admin list before deletion`);
      }

    // Delete the user from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.log(`Error deleting user ${userId}: ${error.message}`);
      return c.json({ error: `Failed to delete user: ${error.message}` }, 500);
    }

    console.log(`User removed: ${userId} by admin ${requestingUser.email}`);
    return c.json({ success: true, message: "User removed successfully" });
  } catch (err) {
    console.log(`Error removing user: ${err}`);
    return c.json({ error: `Failed to remove user: ${err}` }, 500);
  }
});

// ─── Sign up a new user ───
app.post("/make-server-ccc6c9e2/auth/signup", async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required for signup" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split("@")[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      // Provide a user-friendly message for duplicate emails
      if (error.message?.includes("already been registered") || error.message?.includes("already exists")) {
        return c.json({ error: "An account with this email already exists. Please sign in instead.", code: "USER_EXISTS" }, 409);
      }
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    console.log(`User signed up successfully: ${data.user?.id} (${email})`);
    return c.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name,
      },
    }, 201);
  } catch (err) {
    console.log(`Unexpected error during signup: ${err}`);
    return c.json({ error: `Unexpected signup error: ${err}` }, 500);
  }
});

// ─── Verify email exists (for password reset flow) ───
app.post("/make-server-ccc6c9e2/auth/verify-email", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log(`Error verifying email: ${error.message}`);
      return c.json({ error: `Failed to verify email: ${error.message}` }, 500);
    }

    const found = users?.find((u: any) => u.email === email);
    if (!found) {
      return c.json({ error: "No account found with this email address" }, 404);
    }

    console.log(`Email verified for password reset: ${email}`);
    return c.json({ success: true, message: "Account found" });
  } catch (err) {
    console.log(`Error in verify-email: ${err}`);
    return c.json({ error: `Failed to verify email: ${err}` }, 500);
  }
});

// ─── Update password (admin) ──
app.post("/make-server-ccc6c9e2/auth/update-password", async (c) => {
  try {
    const { email, newPassword } = await c.req.json();

    if (!email || !newPassword) {
      return c.json({ error: "Email and new password are required" }, 400);
    }
    if (typeof email !== 'string' || typeof newPassword !== 'string') {
      return c.json({ error: "Invalid data types provided" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return c.json({ error: `Failed to look up user: ${listError.message}` }, 500);
    }

    const targetUser = users?.find((u: any) => u.email === email);
    if (!targetUser) {
      return c.json({ success: true, message: "Password updated if account exists" });
    }

    const { error } = await supabase.auth.admin.updateUserById(targetUser.id, {
      password: newPassword,
    });

    if (error) {
      console.log(`Password update error for ${email}: ${error.message}`);
      return c.json({ error: `Password update failed: ${error.message}` }, 400);
    }

    console.log(`Password updated for: ${email}`);
    return c.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.log(`Unexpected error during password update: ${err}`);
    return c.json({ error: `Password update error: ${err}` }, 500);
  }
});

// ─── Contact Organizer — store a contact message ───
app.post("/make-server-ccc6c9e2/contact-organizer", async (c) => {
  try {
    const body = await c.req.json();
    const { eventId, eventTitle, senderName, senderEmail, senderPhone, subject, message } = body;

    if (!senderName || !senderEmail || !message) {
      return c.json({ error: "Name, email, and message are required" }, 400);
    }
      
      if (typeof senderName !== 'string' || typeof senderEmail !== 'string' || typeof message !== 'string') {
        return c.json({ error: "Invalid data types provided" }, 400);
      }

      const senderUser = await getAuthUser(c);
      let organizerUserId: string | null = null;
      
    let organizerEmail: string | null = null;
    if (eventId) {
      const event: any = await kv.get(eventId);
      if (event) {
        organizerUserId = event.submittedBy || null;
        organizerEmail = event.organizerEmail || null;
      }
    }

    const msgId = `contact_msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const contactMessage = {
      id: msgId,
      eventId: eventId || null,
      eventTitle: eventTitle || null,
      organizerUserId,
      organizerEmail,
      senderUserId: senderUser?.id || null,
      senderName,
      senderEmail,
      senderPhone: senderPhone || null,
      subject: subject || "",
      message,
      createdAt: new Date().toISOString(),
      status: "unread",
      replies: [{
        id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        senderId: senderUser?.id || null,
        senderName: senderName,
        senderEmail: senderEmail,
        message: message,
        createdAt: new Date().toISOString(),
        isInitialMessage: true,
      }],
    };

    await kv.set(msgId, contactMessage);

    // Track in global index for admin retrieval
    let msgIndex: string[] = (await kv.get("contact_messages_index")) || [];
    if (!Array.isArray(msgIndex)) msgIndex = [];
    msgIndex.unshift(msgId);
    await kv.set("contact_messages_index", msgIndex);

    // Also track in per-organizer index so the organizer can see their own messages
    if (organizerUserId) {
      const orgIndexKey = `organizer_messages_${organizerUserId}`;
      let orgIndex: string[] = (await kv.get(orgIndexKey)) || [];
      if (!Array.isArray(orgIndex)) orgIndex = [];
      if (!orgIndex.includes(msgId)) orgIndex.unshift(msgId);
      await kv.set(orgIndexKey, orgIndex);
    }

    // Also track in per-sender index so the sender can see their conversations
    if (senderUser?.id) {
      const senderIndexKey = `sender_conversations_${senderUser.id}`;
      let senderIndex: string[] = (await kv.get(senderIndexKey)) || [];
      if (!Array.isArray(senderIndex)) senderIndex = [];
      if (!senderIndex.includes(msgId)) senderIndex.unshift(msgId);
      await kv.set(senderIndexKey, senderIndex);
    }

    console.log(`Contact message stored: ${msgId} for event ${eventId || "general"}, organizer: ${organizerUserId || organizerEmail || "unknown"}, sender: ${senderUser?.id || "anonymous"}`);
    return c.json({ success: true, messageId: msgId }, 201);
  } catch (err) {
    console.log(`Error storing contact message: ${err}`);
    return c.json({ error: `Failed to send message: ${err}` }, 500);
  }
});

// ─── List contact messages (admin-only — all platform messages) ───
app.get("/make-server-ccc6c9e2/contact-messages", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) return c.json({ error: "Admin access required" }, 403);

    const msgIndex: string[] = (await kv.get("contact_messages_index")) || [];
    if (!Array.isArray(msgIndex) || msgIndex.length === 0) {
      return c.json({ success: true, messages: [] });
    }

    const messages = await kv.mget(msgIndex);
    const validMessages = messages.filter((m: any) => m && m.id);

    // Sort newest first
    validMessages.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`Listed ${validMessages.length} contact messages for admin ${user.email}`);
    return c.json({ success: true, messages: validMessages });
  } catch (err) {
    console.log(`Error listing contact messages: ${err}`);
    return c.json({ error: `Failed to list messages: ${err}` }, 500);
  }
});

// ─── Mark contact message as read (admin or organizer) ──
app.put("/make-server-ccc6c9e2/contact-messages/:id/read", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const msg: any = await kv.get(id);
    if (!msg) return c.json({ error: "Message not found" }, 404);

    // Allow if user is admin OR is the organizer the message is addressed to
    const adminCheck = await isAdmin(user.id);
    const isOrganizer = msg.organizerUserId === user.id;
    if (!adminCheck && !isOrganizer) {
      return c.json({ error: "You don't have permission to update this message" }, 403);
    }

    msg.status = "read";
    msg.readBy = user.id;
    msg.readAt = new Date().toISOString();
    await kv.set(id, msg);

    console.log(`Message ${id} marked as read by ${adminCheck ? "admin" : "organizer"} ${user.email}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error marking message as read: ${err}`);
    return c.json({ error: `Failed to update message: ${err}` }, 500);
  }
});

// ─── Get messages for the logged-in organizer (their events only) ───
app.get("/make-server-ccc6c9e2/my-messages", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const orgIndexKey = `organizer_messages_${user.id}`;
    const orgIndex: string[] = (await kv.get(orgIndexKey)) || [];
    if (!Array.isArray(orgIndex) || orgIndex.length === 0) {
      return c.json({ success: true, messages: [], unreadCount: 0 });
    }

    const messages = await kv.mget(orgIndex);
    const validMessages = messages.filter((m: any) => m && m.id);

    // Sort newest first
    validMessages.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = validMessages.filter((m: any) => m.status === "unread").length;

    console.log(`Listed ${validMessages.length} messages for organizer ${user.email} (${unreadCount} unread)`);
    return c.json({ success: true, messages: validMessages, unreadCount });
  } catch (err) {
    console.log(`Error listing organizer messages: ${err}`);
    return c.json({ error: `Failed to list messages: ${err}` }, 500);
  }
});

// ─── Get unread message count for the logged-in organizer (lightweight) ───
app.get("/make-server-ccc6c9e2/my-messages/count", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ success: true, unreadCount: 0 });

    const orgIndexKey = `organizer_messages_${user.id}`;
    const orgIndex: string[] = (await kv.get(orgIndexKey)) || [];
    if (!Array.isArray(orgIndex) || orgIndex.length === 0) {
      return c.json({ success: true, unreadCount: 0, totalCount: 0 });
    }

    const messages = await kv.mget(orgIndex);
    const validMessages = messages.filter((m: any) => m && m.id);
    const unreadCount = validMessages.filter((m: any) => m.status === "unread").length;

    return c.json({ success: true, unreadCount, totalCount: validMessages.length });
  } catch (err) {
    console.log(`Error getting message count: ${err}`);
    return c.json({ success: true, unreadCount: 0, totalCount: 0 });
  }
});

// ─── Reply to a contact message (organizer sends reply) ───
app.post("/make-server-ccc6c9e2/my-messages/:id/reply", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const msg: any = await kv.get(id);
    if (!msg) return c.json({ error: "Message not found" }, 404);

    // Only the organizer (or admin) can reply
    const adminCheck = await isAdmin(user.id);
    const isOrganizer = msg.organizerUserId === user.id;
    if (!adminCheck && !isOrganizer) {
      return c.json({ error: "You don't have permission to reply to this message" }, 403);
    }

    const { replyMessage } = await c.req.json();
    if (!replyMessage) {
      return c.json({ error: "Reply message is required" }, 400);
    }

    // Store reply within the message object
    if (!Array.isArray(msg.replies)) msg.replies = [];
    msg.replies.push({
      id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: user.id,
      senderName: user.email.split("@")[0],
      senderEmail: user.email,
      from: user.email,
      fromName: user.email.split("@")[0],
      message: replyMessage,
      createdAt: new Date().toISOString(),
    });
    msg.status = "replied";
    msg.lastReplyAt = new Date().toISOString();
    msg.lastReplyBy = user.id;
    await kv.set(id, msg);

    console.log(`Organizer ${user.email} replied to message ${id}`);
    return c.json({ success: true, message: "Reply sent" });
  } catch (err) {
    console.log(`Error replying to message: ${err}`);
    return c.json({ error: `Failed to send reply: ${err}` }, 500);
  }
});

// ─── Seed the database with initial events (idempotent) ───
app.post("/make-server-ccc6c9e2/seed", async (c) => {
  try {
    const existing = await kv.get("event_featured_1");
    if (existing) {
      console.log("Database already seeded, skipping.");
      return c.json({ success: true, message: "Already seeded", count: seedEvents.length });
    }
    const keys = seedEvents.map((e: any) => e.id);
    const values = seedEvents;
    await kv.mset(keys, values);
    console.log(`Database seeded with ${seedEvents.length} events`);
    return c.json({ success: true, message: "Database seeded successfully", count: seedEvents.length }, 201);
  } catch (err) {
    console.log(`Error seeding database: ${err}`);
    return c.json({ error: `Failed to seed database: ${err}` }, 500);
  }
});

// ─── Submit a new event ───
app.post("/make-server-ccc6c9e2/events", async (c) => {
  try {
    const body = await c.req.json();
    const { title, description, category, tags, startDate, endDate, startTime, endTime, venueName, address, city, pricingType, price, capacity, coverImage, organizerName, organizerEmail, organizerPhone, website } = body;

    if (!title || !description || !category || !startDate || !startTime || !venueName || !city || !organizerName || !organizerEmail) {
      return c.json({ error: "Missing required fields for event submission" }, 400);
    }
      

      const user = await getAuthUser(c);

      // Basic type validation
      if (typeof title !== 'string' || typeof description !== 'string' || typeof category !== 'string') {
        return c.json({ error: "Invalid data types provided" }, 400);
      }
    console.log(`User authenticated: ${user ? 'YES' : 'NO'}`);
    if (user) {
      console.log(`User ID: ${user.id}`);
      console.log(`User email: ${user.email}`);
    } else {
      console.log(`⚠️ WARNING: No authenticated user found - submittedBy will be null`);
      console.log(`Authorization header: ${c.req.header("Authorization")?.substring(0, 20)}...`);
      console.log(`X-User-Token header: ${c.req.header("X-User-Token")?.substring(0, 20)}...`);
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const event = {
      id: eventId,
      title,
      description,
      category,
      tags: tags || [],
      startDate,
      endDate: endDate || null,
      startTime,
      endTime: endTime || null,
      venueName,
      address: address || "",
      city,
      pricingType: pricingType || "free",
      price: pricingType === "paid" ? price : null,
      capacity: capacity || null,
      coverImage: coverImage || null,
      organizerName,
      organizerEmail,
      organizerPhone: organizerPhone || "",
      website: website || "",
      submittedBy: user?.id || null,
      status: "pending_review",
      createdAt: new Date().toISOString(),
    };

    await kv.set(eventId, event);

    console.log(`Event submitted successfully: ${eventId} - "${title}" by user ${user?.id || "anonymous"} (${user?.email || "no email"})`);
    console.log(`Event object submittedBy field: ${event.submittedBy}`);
    console.log(`─── End Debug Info ───`);
    return c.json({ success: true, eventId, message: "Event submitted successfully" }, 201);
  } catch (err) {
    console.log(`Error submitting event: ${err}`);
    return c.json({ error: `Failed to submit event: ${err}` }, 500);
  }
});

// ─── Save event draft (requires auth) ───
app.post("/make-server-ccc6c9e2/events/draft", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required to save draft" }, 401);
    }

    const body = await c.req.json();
    const draftKey = `event_draft_${user.id}`;
    
    // Store the draft with a timestamp
    const draft = {
      ...body,
      savedAt: new Date().toISOString(),
    };

    await kv.set(draftKey, draft);
    console.log(`✓ Draft saved for user ${user.id}`);

    return c.json({ success: true, message: "Draft saved successfully", savedAt: draft.savedAt });
  } catch (err) {
    console.error("Error saving draft:", err);
    return c.json({ error: `Failed to save draft: ${err}` }, 500);
  }
});

// ─── Get event draft (requires auth) ───
app.get("/make-server-ccc6c9e2/events/draft", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required to get draft" }, 401);
    }

    const draftKey = `event_draft_${user.id}`;
    const draft = await kv.get(draftKey);

    if (!draft) {
      return c.json({ draft: null });
    }

    console.log(`✓ Draft retrieved for user ${user.id}`);
    return c.json({ draft });
  } catch (err) {
    console.error("Error retrieving draft:", err);
    return c.json({ error: `Failed to retrieve draft: ${err}` }, 500);
  }
});

// ─── Delete event draft (requires auth) ───
app.delete("/make-server-ccc6c9e2/events/draft", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required to delete draft" }, 401);
    }

    const draftKey = `event_draft_${user.id}`;
    await kv.del(draftKey);
    console.log(`✓ Draft deleted for user ${user.id}`);

    return c.json({ success: true, message: "Draft deleted successfully" });
  } catch (err) {
    console.error("Error deleting draft:", err);
    return c.json({ error: `Failed to delete draft: ${err}` }, 500);
  }
});

// ─── Get all submitted events ───
// Query params: ?status=approved&featured=true&upcoming=true&category=Music&limit=10&sortBy=rsvp
app.get("/make-server-ccc6c9e2/events", async (c) => {
  try {
    const status = c.req.query("status");
    const featured = c.req.query("featured");
    const upcoming = c.req.query("upcoming");
    const category = c.req.query("category");
    const limitStr = c.req.query("limit");
    const sortBy = c.req.query("sortBy");

    const events = await kv.getByPrefix("event_");
    // Filter out draft objects and non-event entries (drafts use key "event_draft_*")
    let filtered = events.filter((e: any) => e && e.id && e.status && !e.savedAt);

    if (status) filtered = filtered.filter((e: any) => e.status === status);
    if (featured === "true") filtered = filtered.filter((e: any) => e.featured === true);
    if (upcoming === "true") filtered = filtered.filter((e: any) => e.upcoming === true);
    if (category) filtered = filtered.filter((e: any) => e.category === category);

    // Enrich with real RSVP counts
    if (sortBy === "rsvp" || sortBy === "going") {
      // Fetch RSVP data for each event individually to preserve correct mapping
      const enriched = await Promise.all(
        filtered.map(async (e: any) => {
          try {
            const rsvpList: any[] = (await kv.get(`rsvp:${e.id}`)) || [];
            const realRsvpCount = Array.isArray(rsvpList) ? rsvpList.length : 0;
            // Use only real RSVP count, not seed attendees
            const rsvpUsers = Array.isArray(rsvpList)
              ? rsvpList.slice(0, 10).map((r: any) => ({ name: r.name, avatar: r.avatar }))
              : [];
            return { ...e, rsvpCount: realRsvpCount, rsvpUsers };
          } catch (_err) {
            return { ...e, rsvpCount: 0, rsvpUsers: [] };
          }
        })
      );
      filtered = enriched;

      // Sort by rsvpCount descending (most going first)
      filtered.sort((a: any, b: any) => (b.rsvpCount || 0) - (a.rsvpCount || 0));
    } else {
      // Default sort by startDate ascending
      filtered.sort((a: any, b: any) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
    }

    if (limitStr) {
      const limit = parseInt(limitStr);
      if (!isNaN(limit) && limit > 0) filtered = filtered.slice(0, limit);
    }

    console.log(`Fetched ${filtered.length} events (status=${status || "all"}, featured=${featured || "any"}, sortBy=${sortBy || "date"})`);
    return c.json({ success: true, events: filtered });
  } catch (err) {
    console.log(`Error fetching events: ${err}`);
    return c.json({ error: `Failed to fetch events: ${err}` }, 500);
  }
});

// ─── Get a single event by ID ───
app.get("/make-server-ccc6c9e2/events/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const event = await kv.get(id);
    if (!event) {
      return c.json({ error: `Event not found: ${id}` }, 404);
    }
    return c.json({ success: true, event });
  } catch (err) {
    console.log(`Error fetching event ${c.req.param("id")}: ${err}`);
    return c.json({ error: `Failed to fetch event: ${err}` }, 500);
  }
});

// ─── RSVP to an event (requires auth) ───
app.post("/make-server-ccc6c9e2/events/:id/rsvp", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required to RSVP" }, 401);
    }

    const eventId = c.req.param("id");
    const event = await kv.get(eventId);
    if (!event) {
      return c.json({ error: `Event not found: ${eventId}` }, 404);
    }

    // Get user metadata for avatar display
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const { data: { user: fullUser } } = await supabase.auth.admin.getUserById(user.id);
    const userName = fullUser?.user_metadata?.name || fullUser?.user_metadata?.full_name || user.email.split("@")[0];
    const userAvatar = fullUser?.user_metadata?.avatar_url || null;

    const rsvpKey = `rsvp:${eventId}`;
    let rsvpList: any[] = (await kv.get(rsvpKey)) || [];
    if (!Array.isArray(rsvpList)) rsvpList = [];

    // Check if already RSVP'd
    if (rsvpList.some((r: any) => r.userId === user.id)) {
      return c.json({ success: true, message: "Already RSVP'd", alreadyRsvpd: true });
    }

    rsvpList.push({
      userId: user.id,
      name: userName,
      avatar: userAvatar,
      email: user.email,
      rsvpAt: new Date().toISOString(),
    });
    await kv.set(rsvpKey, rsvpList);

    console.log(`User ${user.email} RSVP'd to event ${eventId}. Total RSVPs: ${rsvpList.length}`);
    return c.json({ success: true, rsvpCount: rsvpList.length, message: "RSVP successful!" });
  } catch (err) {
    console.log(`Error RSVP to event ${c.req.param("id")}: ${err}`);
    return c.json({ error: `Failed to RSVP: ${err}` }, 500);
  }
});

// ─── Remove RSVP from an event (requires auth) ──
app.delete("/make-server-ccc6c9e2/events/:id/rsvp", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const eventId = c.req.param("id");
    const rsvpKey = `rsvp:${eventId}`;
    let rsvpList: any[] = (await kv.get(rsvpKey)) || [];
    if (!Array.isArray(rsvpList)) rsvpList = [];

    rsvpList = rsvpList.filter((r: any) => r.userId !== user.id);
    await kv.set(rsvpKey, rsvpList);

    console.log(`User ${user.email} removed RSVP from event ${eventId}. Total RSVPs: ${rsvpList.length}`);
    return c.json({ success: true, rsvpCount: rsvpList.length, message: "RSVP removed" });
  } catch (err) {
    console.log(`Error removing RSVP from event ${c.req.param("id")}: ${err}`);
    return c.json({ error: `Failed to remove RSVP: ${err}` }, 500);
  }
});

// ─── Get RSVP data for an event ───
app.get("/make-server-ccc6c9e2/events/:id/rsvp", async (c) => {
  try {
    const eventId = c.req.param("id");
    const rsvpKey = `rsvp:${eventId}`;
    const rsvpList: any[] = (await kv.get(rsvpKey)) || [];

    // Check if current user has RSVP'd
    const user = await getAuthUser(c);
    const hasRsvpd = user ? rsvpList.some((r: any) => r.userId === user.id) : false;

    // Return first 10 users for display (without emails for privacy)
    const rsvpUsers = rsvpList.slice(0, 10).map((r: any) => ({
      name: r.name,
      avatar: r.avatar,
      rsvpAt: r.rsvpAt,
    }));

    return c.json({
      success: true,
      rsvpCount: rsvpList.length,
      rsvpUsers,
      hasRsvpd,
    });
  } catch (err) {
    console.log(`Error fetching RSVP for event ${c.req.param("id")}: ${err}`);
    return c.json({ error: `Failed to fetch RSVP data: ${err}` }, 500);
  }
});

// ─── Get RSVP counts for specific events (batch) ───
app.post("/make-server-ccc6c9e2/rsvp/batch", async (c) => {
  try {
    const { eventIds } = await c.req.json();
    if (!Array.isArray(eventIds)) {
      return c.json({ error: "eventIds must be an array" }, 400);
    }

    const results: Record<string, number> = {};
    for (const eventId of eventIds) {
      const rsvpKey = `rsvp:${eventId}`;
      const rsvpList: any[] = (await kv.get(rsvpKey)) || [];
      results[eventId] = Array.isArray(rsvpList) ? rsvpList.length : 0;
    }

    return c.json({ success: true, rsvpCounts: results });
  } catch (err) {
    console.log(`Error fetching batch RSVP counts: ${err}`);
    return c.json({ error: `Failed to fetch RSVP counts: ${err}` }, 500);
  }
});

// ─── Get user's RSVPs (all events user has RSVP'd to) ───
app.get("/make-server-ccc6c9e2/my-rsvps", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    // Get all events
    const allEvents: any[] = await kv.getByPrefix("");
    const events = allEvents.filter((item: any) => 
      item && typeof item === 'object' && item.id && item.title
    );

    // Find events where user has RSVP'd
    const userRsvps: any[] = [];
    
    for (const event of events) {
      const rsvpKey = `rsvp:${event.id}`;
      const rsvpList: any[] = (await kv.get(rsvpKey)) || [];
      
      const userRsvp = rsvpList.find((r: any) => r.userId === user.id);
      if (userRsvp) {
        userRsvps.push({
          ...event,
          rsvpAt: userRsvp.rsvpAt,
          rsvpCount: rsvpList.length,
        });
      }
    }

    // Sort by RSVP date (most recent first)
    userRsvps.sort((a, b) => 
      new Date(b.rsvpAt).getTime() - new Date(a.rsvpAt).getTime()
    );

    return c.json({ 
      success: true, 
      events: userRsvps,
      count: userRsvps.length 
    });
  } catch (err) {
    console.error(`Error fetching user RSVPs: ${err}`);
    return c.json({ error: `Failed to fetch RSVPs: ${err}` }, 500);
  }
});

// ─── Add event to favorites ───
app.post("/make-server-ccc6c9e2/favorites/:eventId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const eventId = c.req.param("eventId");
    const favoritesKey = `favorites:${user.id}`;
    
    let favorites: string[] = (await kv.get(favoritesKey)) || [];
    if (!Array.isArray(favorites)) favorites = [];
    
    // Add to favorites if not already there
    if (!favorites.includes(eventId)) {
      favorites.push(eventId);
      await kv.set(favoritesKey, favorites);
    }

    return c.json({ success: true, favorites });
  } catch (err) {
    console.error(`Error adding favorite: ${err}`);
    return c.json({ error: `Failed to add favorite: ${err}` }, 500);
  }
});

// ─── Remove event from favorites ───
app.delete("/make-server-ccc6c9e2/favorites/:eventId", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const eventId = c.req.param("eventId");
    const favoritesKey = `favorites:${user.id}`;
    
    let favorites: string[] = (await kv.get(favoritesKey)) || [];
    if (!Array.isArray(favorites)) favorites = [];
    
    // Remove from favorites
    favorites = favorites.filter(id => id !== eventId);
    await kv.set(favoritesKey, favorites);

    return c.json({ success: true, favorites });
  } catch (err) {
    console.error(`Error removing favorite: ${err}`);
    return c.json({ error: `Failed to remove favorite: ${err}` }, 500);
  }
});

// ─── Get user's favorites ───
app.get("/make-server-ccc6c9e2/favorites", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const favoritesKey = `favorites:${user.id}`;
    let favoriteIds: string[] = (await kv.get(favoritesKey)) || [];
    if (!Array.isArray(favoriteIds)) favoriteIds = [];

    // Get full event data for favorites
    const favoriteEvents = [];
    for (const eventId of favoriteIds) {
      const event: any = await kv.get(eventId);
      if (event && event.id) {
        // Get RSVP count
        const rsvpKey = `rsvp:${eventId}`;
        const rsvpList: any[] = (await kv.get(rsvpKey)) || [];
        
        favoriteEvents.push({
          ...event,
          rsvpCount: Array.isArray(rsvpList) ? rsvpList.length : 0,
        });
      }
    }

    return c.json({ 
      success: true, 
      events: favoriteEvents,
      favoriteIds,
      count: favoriteEvents.length 
    });
  } catch (err) {
    console.error(`Error fetching favorites: ${err}`);
    return c.json({ error: `Failed to fetch favorites: ${err}` }, 500);
  }
});

// ─── Get user's archived and deleted conversation IDs ───
app.get("/make-server-ccc6c9e2/conversations/meta/status", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const archived: string[] = (await kv.get(`archived_conversations_${user.id}`)) || [];
    const deleted: string[] = (await kv.get(`deleted_conversations_${user.id}`)) || [];
    return c.json({ success: true, archived: Array.isArray(archived) ? archived : [], deleted: Array.isArray(deleted) ? deleted : [] });
  } catch (err) {
    console.log(`Error fetching conversation meta: ${err}`);
    return c.json({ error: `Failed to fetch conversation meta: ${err}` }, 500);
  }
});

// ─── Get all conversations for the logged-in user (both as sender AND organizer) ───
app.get("/make-server-ccc6c9e2/conversations", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    // Gather IDs from both sender and organizer indexes
    const senderIndex: string[] = (await kv.get(`sender_conversations_${user.id}`)) || [];
    const orgIndex: string[] = (await kv.get(`organizer_messages_${user.id}`)) || [];
    const allIds = [...new Set([...(Array.isArray(senderIndex) ? senderIndex : []), ...(Array.isArray(orgIndex) ? orgIndex : [])])];

    if (allIds.length === 0) {
      return c.json({ success: true, conversations: [], unreadCount: 0 });
    }

    // Get archived and deleted conversation IDs for this user
    const archived: string[] = (await kv.get(`archived_conversations_${user.id}`)) || [];
    const deleted: string[] = (await kv.get(`deleted_conversations_${user.id}`)) || [];
    const archivedSet = new Set(Array.isArray(archived) ? archived : []);
    const deletedSet = new Set(Array.isArray(deleted) ? deleted : []);

    const messages = await kv.mget(allIds);
    const valid = messages.filter((m: any) => m && m.id);

    // Sort by most recent activity (lastReplyAt or createdAt)
    valid.sort((a: any, b: any) => {
      const aTime = a.lastReplyAt || a.createdAt || "";
      const bTime = b.lastReplyAt || b.createdAt || "";
      return bTime.localeCompare(aTime);
    });

    // For each conversation, determine the "other party" name for display
    const enriched = valid.map((conv: any) => {
      const isSender = conv.senderUserId === user.id;
      const isOrg = conv.organizerUserId === user.id;
      const otherName = isSender
        ? (conv.organizerEmail?.split("@")[0] || "Organizer")
        : (conv.senderName || conv.senderEmail?.split("@")[0] || "User");
      const lastReply = Array.isArray(conv.replies) && conv.replies.length > 0
        ? conv.replies[conv.replies.length - 1]
        : null;
      const hasUnread = lastReply && lastReply.senderId !== user.id && conv.status !== "read" && conv.lastReplyBy !== user.id;
      return { ...conv, _otherName: otherName, _isSender: isSender, _isOrganizer: isOrg, _lastReply: lastReply, _hasUnread: hasUnread };
    });

    // Count unread conversations EXCLUDING archived and deleted ones
    const unreadCount = enriched.filter((c: any) => 
      c._hasUnread && !archivedSet.has(c.id) && !deletedSet.has(c.id)
    ).length;

    return c.json({ success: true, conversations: enriched, unreadCount });
  } catch (err) {
    console.log(`Error fetching conversations: ${err}`);
    return c.json({ error: `Failed to fetch conversations: ${err}` }, 500);
  }
});

// ─── Get a single conversation thread ───
app.get("/make-server-ccc6c9e2/conversations/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const msg: any = await kv.get(id);
    if (!msg) return c.json({ error: "Conversation not found" }, 404);

    // Verify the user is a participant
    const isSender = msg.senderUserId === user.id;
    const isOrg = msg.organizerUserId === user.id;
    const adminCheck = await isAdmin(user.id);
    if (!isSender && !isOrg && !adminCheck) {
      return c.json({ error: "You don't have access to this conversation" }, 403);
    }

    return c.json({ success: true, conversation: msg });
  } catch (err) {
    console.log(`Error fetching conversation: ${err}`);
    return c.json({ error: `Failed to fetch conversation: ${err}` }, 500);
  }
});

// ─── Send a message in a conversation (bidirectional — either party can reply) ───
app.post("/make-server-ccc6c9e2/conversations/:id/messages", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const msg: any = await kv.get(id);
    if (!msg) return c.json({ error: "Conversation not found" }, 404);

    // Verify the user is a participant
    const isSender = msg.senderUserId === user.id;
    const isOrg = msg.organizerUserId === user.id;
    const adminCheck = await isAdmin(user.id);
    if (!isSender && !isOrg && !adminCheck) {
      return c.json({ error: "You don't have access to this conversation" }, 403);
    }

    const { message: replyText } = await c.req.json();
    if (!replyText || !replyText.trim()) {
      return c.json({ error: "Message is required" }, 400);
    }

    if (!Array.isArray(msg.replies)) msg.replies = [];
    const newReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: user.id,
      senderName: user.email.split("@")[0],
      senderEmail: user.email,
      message: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    msg.replies.push(newReply);
    msg.lastReplyAt = newReply.createdAt;
    msg.lastReplyBy = user.id;
    // Update status based on who replied
    if (isOrg) {
      msg.status = "replied";
    }
    await kv.set(id, msg);

    console.log(`${isSender ? "Sender" : "Organizer"} ${user.email} sent message in conversation ${id}`);
    return c.json({ success: true, reply: newReply });
  } catch (err) {
    console.log(`Error sending message in conversation: ${err}`);
    return c.json({ error: `Failed to send message: ${err}` }, 500);
  }
});

// ─── Mark conversation as read (updates lastReplyBy to clear unread status) ───
app.patch("/make-server-ccc6c9e2/conversations/:id/mark-read", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const conv: any = await kv.get(id);
    if (!conv) return c.json({ error: "Conversation not found" }, 404);

    const isSender = conv.senderUserId === user.id;
    const isOrg = conv.organizerUserId === user.id;
    if (!isSender && !isOrg) {
      return c.json({ error: "You don't have access to this conversation" }, 403);
    }

    // Update lastReplyBy to current user - this clears the unread indicator
    conv.lastReplyBy = user.id;
    await kv.set(id, conv);

    console.log(`Conversation ${id} marked as read by ${user.email}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error marking conversation as read: ${err}`);
    return c.json({ error: `Failed to mark conversation as read: ${err}` }, 500);
  }
});

// ─── Archive a conversation (per-user soft archive) ───
app.patch("/make-server-ccc6c9e2/conversations/:id/archive", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const msg: any = await kv.get(id);
    if (!msg) return c.json({ error: "Conversation not found" }, 404);

    const isSender = msg.senderUserId === user.id;
    const isOrg = msg.organizerUserId === user.id;
    if (!isSender && !isOrg) {
      return c.json({ error: "You don't have access to this conversation" }, 403);
    }

    // Store archived state per-user in KV
    const archiveKey = `archived_conversations_${user.id}`;
    let archived: string[] = (await kv.get(archiveKey)) || [];
    if (!Array.isArray(archived)) archived = [];

    const { archive } = await c.req.json();
    if (archive) {
      if (!archived.includes(id)) archived.push(id);
    } else {
      archived = archived.filter((aid: string) => aid !== id);
    }
    await kv.set(archiveKey, archived);

    console.log(`User ${user.email} ${archive ? 'archived' : 'unarchived'} conversation ${id}`);
    return c.json({ success: true, archived: !!archive });
  } catch (err) {
    console.log(`Error archiving conversation: ${err}`);
    return c.json({ error: `Failed to archive conversation: ${err}` }, 500);
  }
});

// ─── Delete a conversation (per-user soft delete — removes from user's index) ───
app.delete("/make-server-ccc6c9e2/conversations/:id", async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const id = c.req.param("id");
    const msg: any = await kv.get(id);
    if (!msg) return c.json({ error: "Conversation not found" }, 404);

    const isSender = msg.senderUserId === user.id;
    const isOrg = msg.organizerUserId === user.id;
    if (!isSender && !isOrg) {
      return c.json({ error: "You don't have access to this conversation" }, 403);
    }

    // Store deleted state per-user in KV
    const deleteKey = `deleted_conversations_${user.id}`;
    let deleted: string[] = (await kv.get(deleteKey)) || [];
    if (!Array.isArray(deleted)) deleted = [];
    if (!deleted.includes(id)) deleted.push(id);
    await kv.set(deleteKey, deleted);

    console.log(`User ${user.email} deleted conversation ${id}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error deleting conversation: ${err}`);
    return c.json({ error: `Failed to delete conversation: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);