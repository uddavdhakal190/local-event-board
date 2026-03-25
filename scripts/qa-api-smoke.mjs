import { createClient } from '@supabase/supabase-js';

const projectId = 'ceucfqrlnvepkizlzpkr';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldWNmcXJsbnZlcGtpemx6cGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDM1NDAsImV4cCI6MjA4NzcxOTU0MH0.EzuA9hPOwb9Ekd0FUDag0y-PN74S57Rmj8-m7yrS15U';
const supabaseUrl = `https://${projectId}.supabase.co`;

const anon = createClient(supabaseUrl, publicAnonKey);

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function run() {
  const results = [];
  const record = (name, pass, detail) => results.push({ name, pass, detail });

  // 1) Public event read smoke
  const eventsRes = await anon
    .from('events')
    .select('id,title,status,is_draft')
    .eq('status', 'approved')
    .eq('is_draft', false)
    .limit(5);

  if (eventsRes.error) {
    record('anon_read_approved_events', false, eventsRes.error.message);
  } else {
    record('anon_read_approved_events', true, `rows=${eventsRes.data.length}`);
  }

  const eventIds = (eventsRes.data || []).map((e) => e.id);

  // 2) Public RSVP aggregate RPC smoke
  const rsvpRpcRes = await anon.rpc('rsvp_counts_by_event_ids', {
    event_ids: eventIds,
  });

  if (rsvpRpcRes.error) {
    record('anon_rsvp_counts_rpc', false, rsvpRpcRes.error.message);
  } else {
    record('anon_rsvp_counts_rpc', true, `rows=${(rsvpRpcRes.data || []).length}`);
  }

  // 3) Verify restricted RPC cannot run as anon
  const adminExistsAnonRes = await anon.rpc('admin_exists');
  if (adminExistsAnonRes.error) {
    record('anon_admin_exists_restricted', true, adminExistsAnonRes.error.message);
  } else {
    record('anon_admin_exists_restricted', false, 'Unexpectedly succeeded for anon');
  }

  // 4) Attempt real signup/login for authenticated-path verification
  const email = `qa-smoke-${nowStamp()}@example.com`;
  const password = `Qa!Smoke123-${Math.floor(Math.random() * 1000)}`;

  const signupRes = await anon.auth.signUp({ email, password });
  if (signupRes.error) {
    record('auth_signup', false, signupRes.error.message);
  } else {
    const hasSession = Boolean(signupRes.data.session?.access_token);
    record('auth_signup', true, hasSession ? 'signup_session_created' : 'signup_created_no_session');
  }

  let authed = anon;
  if (!signupRes.error && !signupRes.data.session) {
    const signInRes = await anon.auth.signInWithPassword({ email, password });
    if (signInRes.error) {
      record('auth_signin_after_signup', false, signInRes.error.message);
    } else {
      record('auth_signin_after_signup', true, 'signin_ok');
    }
  }

  const sessionRes = await anon.auth.getSession();
  const accessToken = sessionRes.data.session?.access_token;
  if (accessToken) {
    authed = createClient(supabaseUrl, publicAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    const authedAdminExistsRes = await authed.rpc('admin_exists');
    if (authedAdminExistsRes.error) {
      record('auth_admin_exists', false, authedAdminExistsRes.error.message);
    } else {
      record('auth_admin_exists', true, `admin_exists=${Boolean(authedAdminExistsRes.data)}`);
    }

    if (eventIds.length > 0) {
      const favInsertRes = await authed
        .from('favorites')
        .insert({ event_id: eventIds[0], user_id: sessionRes.data.session.user.id });

      if (favInsertRes.error) {
        record('auth_insert_favorite', false, favInsertRes.error.message);
      } else {
        record('auth_insert_favorite', true, 'inserted');

        const favDeleteRes = await authed
          .from('favorites')
          .delete()
          .eq('event_id', eventIds[0])
          .eq('user_id', sessionRes.data.session.user.id);

        if (favDeleteRes.error) {
          record('auth_delete_favorite_cleanup', false, favDeleteRes.error.message);
        } else {
          record('auth_delete_favorite_cleanup', true, 'deleted');
        }
      }

      // Test messaging functionality
      const msgInsertRes = await authed
        .rpc('create_contact_message', {
          event_id_param: eventIds[0],
          event_title_param: "Smoke Test Event",
          sender_name_param: "QA Smoke User",
          sender_email_param: email,
          sender_phone_param: "1234567890",
          subject_param: "Smoke Test Message",
          message_param: "This is a test message to ensure the messaging feature works."
        });
        
      if (msgInsertRes.error) {
        record('auth_insert_message', false, msgInsertRes.error.message);
      } else {
        record('auth_insert_message', true, 'inserted via RPC');
      }
    }
  } else {
    record('auth_session_available', false, 'No auth session after signup/signin; authenticated flow not testable');
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { passed, failed, total: results.length },
    results,
  }, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('qa-api-smoke fatal:', err);
  process.exit(1);
});
