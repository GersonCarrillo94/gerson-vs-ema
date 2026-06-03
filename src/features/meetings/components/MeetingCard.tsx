import type { Meeting } from '../types';
import { STATUS_CONFIG, TOPIC_CATEGORIES } from '../types';

interface Props {
  meeting: Meeting;
  currentUserId: string;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onMarkAttendance?: (meeting: Meeting) => void;
  onJoinVideo?: (meeting: Meeting) => void;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

function isPast(iso: string): boolean {
  return new Date(iso) < new Date();
}

function isInstantMeeting(meeting: Meeting): boolean {
  const diff = Math.abs(
    new Date(meeting.scheduled_at).getTime() - new Date(meeting.created_at).getTime(),
  );
  return diff < 3 * 60 * 1000;
}

function canJoinVideo(meeting: Meeting): boolean {
  if (!meeting.is_video_call || !meeting.video_room_url) return false;
  if (meeting.status !== 'confirmed') return false;
  const minutesBefore = (new Date(meeting.scheduled_at).getTime() - Date.now()) / 60000;
  return minutesBefore <= 15;
}

function needsAttendance(meeting: Meeting, userId: string): boolean {
  if (meeting.status !== 'confirmed') return false;
  if (!isPast(meeting.scheduled_at)) return false;
  const isCreator = meeting.created_by === userId;
  return isCreator
    ? meeting.attended_by_creator === null
    : meeting.attended_by_partner === null;
}

export function MeetingCard({
  meeting,
  currentUserId,
  onConfirm,
  onReject,
  onCancel,
  onMarkAttendance,
  onJoinVideo,
}: Props) {
  const { date, time } = formatDateTime(meeting.scheduled_at);
  const isCreator = meeting.created_by === currentUserId;
  const isPartner = meeting.partner_id === currentUserId;
  const statusCfg = STATUS_CONFIG[meeting.status];
  const topicCfg = TOPIC_CATEGORIES[meeting.topic_category];
  const past = isPast(meeting.scheduled_at);
  const joinable = canJoinVideo(meeting);
  const pendingAttendance = needsAttendance(meeting, currentUserId);
  const instant = isInstantMeeting(meeting);

  return (
    <div
      className={[
        'rounded-2xl border bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md',
        pendingAttendance ? 'ring-2 ring-amber-400 ring-offset-1' : '',
      ].join(' ')}
    >
      {/* Banda de color superior */}
      <div
        className={[
          'h-1',
          meeting.status === 'confirmed' ? 'bg-green-500' :
          meeting.status === 'pending' ? 'bg-amber-400' :
          meeting.status === 'completed' ? 'bg-blue-500' :
          meeting.status === 'missed' ? 'bg-red-500' : 'bg-gray-300',
        ].join(' ')}
      />

      <div className="p-4">
        {/* Cabecera: estado + acción de video */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>

          {joinable && onJoinVideo && (
            <button
              onClick={() => { onJoinVideo(meeting); }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              📹 Unirse ahora
            </button>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="flex items-center gap-2 text-gray-700 mb-1">
          <span className="text-lg">{instant ? '⚡' : '📅'}</span>
          <div>
            <p className="text-sm font-semibold capitalize">
              {instant ? 'Reunión instantánea' : date}
            </p>
            <p className="text-xs text-gray-500">{time} · {meeting.duration_estimate_minutes} min est.</p>
          </div>
        </div>

        {/* Tema */}
        <div className="flex items-center gap-2 text-gray-600 mt-2 mb-2">
          <span>{topicCfg.emoji}</span>
          <div>
            <span className="text-xs text-gray-400 mr-1">{topicCfg.label}</span>
            <span className="text-sm font-medium text-gray-800">{meeting.topic}</span>
          </div>
        </div>

        {/* Lugar o videollamada */}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          {meeting.is_video_call ? (
            <><span>🎥</span><span>Videollamada Daily.co</span></>
          ) : meeting.location ? (
            <><span>📍</span><span>{meeting.location}</span></>
          ) : null}
        </div>

        {/* Notas */}
        {meeting.notes && (
          <p className="mt-2 text-xs text-gray-400 italic line-clamp-2">{meeting.notes}</p>
        )}

        {/* Resultado si completada */}
        {meeting.status === 'completed' && meeting.actual_duration_minutes && (
          <div className="mt-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
            ✅ Completada — {meeting.actual_duration_minutes} min reales
          </div>
        )}

        {/* Aviso de asistencia pendiente */}
        {pendingAttendance && (
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
            ⏳ ¿Asististe a esta reunión? Márcala ahora.
          </div>
        )}

        {/* Acciones */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Partner puede confirmar/rechazar reuniones pending */}
          {meeting.status === 'pending' && isPartner && (
            <>
              {onConfirm && (
                <button
                  onClick={() => { onConfirm(meeting.id); }}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  ✓ Confirmar
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => { onReject(meeting.id); }}
                  className="flex-1 rounded-lg bg-white border border-red-300 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  ✕ Rechazar
                </button>
              )}
            </>
          )}

          {/* Creador puede cancelar reuniones pending o confirmed */}
          {['pending', 'confirmed'].includes(meeting.status) && isCreator && !past && onCancel && (
            <button
              onClick={() => { onCancel(meeting.id); }}
              className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}

          {/* Marcar asistencia */}
          {pendingAttendance && onMarkAttendance && (
            <button
              onClick={() => { onMarkAttendance(meeting); }}
              className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Marcar asistencia
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
