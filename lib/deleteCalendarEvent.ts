import { createClient } from '@supabase/supabase-js'
import { getAccessToken } from './googleAuth'   // ← insert で使っているものと同じ
                                                 // googleAuth.ts で getAccessToken が export されている前提

// ✅ Supabase クライアント（ログ記録用）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * ✅ Googleカレンダーイベント削除（fetch + getAccessToken方式）
 * @param vehicleId - 車両ID (例: car01, car02, car03)
 * @param eventId - 削除対象のGoogleカレンダーイベントID
 */
export async function deleteCalendarEvent(vehicleId: string, eventId: string) {
  // ✅ カレンダーIDマップ
  const calendarMap: Record<string, string> = {
    car01: process.env.CAR01_CALENDAR_ID!,
    car02: process.env.CAR02_CALENDAR_ID!,
    car03: process.env.CAR03_CALENDAR_ID!,
  };

  const calendarId = calendarMap[vehicleId];

  if (!calendarId) {
    console.error(`❌ カレンダーIDが見つかりません vehicleId=${vehicleId}`);
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-error',
        reservation_id: null,
        details: `vehicleId=${vehicleId} に対応するカレンダーIDが見つかりません`
      }
    ]);
    return { success: false, error: `vehicleId=${vehicleId} のカレンダーIDが未定義` };
  }

  try {
    // ✅ Googleサービスアカウントのトークン取得（insertと同じ）
    const accessToken = await getAccessToken();

    // ✅ 削除開始ログ
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-start',
        reservation_id: null,
        details: `イベントID: ${eventId} / カレンダーID: ${calendarId}`
      }
    ]);

    // ✅ Googleカレンダーイベント削除
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,  // ✅ insert と同じ token で認証
        },
      }
    );

    if (res.status === 204) {
      console.log(`✅ Googleカレンダー削除成功: ${eventId} (vehicle=${vehicleId})`);
      await supabase.from('system_logs').insert([
        {
          action: 'google-event-deleted',
          reservation_id: null,
          details: `成功: EventID=${eventId} / CalendarID=${calendarId} / Vehicle=${vehicleId}`
        }
      ]);
      return { success: true };
    } else {
      const errData = await res.json();
      console.error('🔴 Googleカレンダー削除失敗:', errData);
      await supabase.from('system_logs').insert([
        {
          action: 'google-event-delete-error',
          reservation_id: null,
          details: `Status=${res.status} / ${JSON.stringify(errData)}`
        }
      ]);
      return { success: false, error: errData };
    }
  } catch (err: any) {
    console.error('🔥 deleteCalendarEvent エラー:', err);
    await supabase.from('system_logs').insert([
      {
        action: 'google-event-delete-error',
        reservation_id: null,
        details: `Error: ${err.message || String(err)}`
      }
    ]);
    return { success: false, error: err };
  }
}
