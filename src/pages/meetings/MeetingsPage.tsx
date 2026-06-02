import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMeetings, useConfirmMeeting, useRejectMeeting, useCancelMeeting, useMarkAttendance, useCreateMeeting } from '@/features/meetings/hooks/useMeetings';
import { useRealtimeMeetings } from '@/features/meetings/hooks/useRealtimeMeetings';
import { useMeetingTimer } from '@/features/meetings/hooks/useMeetingTimer';
import { MeetingCalendar } from '@/features/meetings/components/MeetingCalendar';
import { MeetingCard } from '@/features/meetings/components/MeetingCard';
import { MeetingTimerPanel } from '@/features/meetings/components/MeetingTimerPanel';
import { CreateMeetingModal } from '@/features/meetings/components/CreateMeetingModal';
import { AttendanceModal } from '@/features/meetings/components/AttendanceModal';
import { VideoCallRoom } from '@/features/meetings/components/VideoCallRoom';
import type { Meeting, CreateMeetingInput } from '@/features/meetings/types';

type TabId = 'calendar' | 'list';

export function MeetingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: meetings = [], isLoading } = useMeetings();
  const { stats: timerStats } = useMeetingTimer();
  useRealtimeMeetings();

  const confirmMeeting = useConfirmMeeting();
  const rejectMeeting = useRejectMeeting();
  const cancelMeeting = useCancelMeeting();
  const markAttendance = useMarkAttendance();
  const createMeeting = useCreateMeeting();

  const [activeTab, setActiveTab] = useState<TabId>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [attendanceMeeting, setAttendanceMeeting] = useState<Meeting | null>(null);
  const [videoMeeting, setVideoMeeting] = useState<Meeting | null>(null);

  const userId = user?.id ?? '';
  const partnerId = user?.partner_id ?? '';

  // Meetings del día seleccionado (en vista calendario)
  const meetingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return meetings.filter((m) => m.scheduled_at.startsWith(selectedDate));
  }, [meetings, selectedDate]);

  // Meetings próximas (ordenadas por fecha ascendente, solo futuras o de hoy)
  const upcomingMeetings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...meetings]
      .filter((m) => m.scheduled_at >= today && !['cancelled', 'rejected'].includes(m.status))
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [meetings]);

  // Meetings pasadas
  const pastMeetings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...meetings]
      .filter((m) => m.scheduled_at < today)
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  }, [meetings]);

  // Estadísticas del mes
  const thisMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthMeetings = meetings.filter((m) => m.scheduled_at.startsWith(thisMonthStr));
  const completedThisMonth = thisMonthMeetings.filter((m) => m.status === 'completed').length;
  const attendanceRate = completedThisMonth > 0
    ? Math.round((completedThisMonth / Math.max(thisMonthMeetings.filter(m => ['completed', 'missed'].includes(m.status)).length, 1)) * 100)
    : 100;

  // Pendientes de asistencia (para banner)
  const pendingAttendance = meetings.filter((m) => {
    if (m.status !== 'confirmed') return false;
    if (new Date(m.scheduled_at) > new Date()) return false;
    const isCreator = m.created_by === userId;
    return isCreator ? m.attended_by_creator === null : m.attended_by_partner === null;
  });

  async function handleCreateMeeting(data: CreateMeetingInput) {
    await createMeeting.mutateAsync(data);
  }

  async function handleAttendance(attended: boolean, actualDuration?: number) {
    if (!attendanceMeeting) return;
    const iAmCreator = attendanceMeeting.created_by === userId;
    await markAttendance.mutateAsync({
      meetingId: attendanceMeeting.id,
      iAmCreator,
      iAttended: attended,
      actualDurationMinutes: actualDuration,
    });
  }

  function handleLeaveVideo(durationMinutes: number) {
    if (!videoMeeting) return;
    // Guardar duración real antes de cerrar
    markAttendance.mutate({
      meetingId: videoMeeting.id,
      iAmCreator: videoMeeting.created_by === userId,
      iAttended: true,
      actualDurationMinutes: durationMinutes,
    });
    setVideoMeeting(null);
    // Abrir modal de asistencia para el otro usuario también
    setAttendanceMeeting(videoMeeting);
  }

  if (!user || !partnerId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Necesitas un compañero para usar las reuniones.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8">
      {/* Videollamada activa */}
      {videoMeeting?.video_room_url && (
        <VideoCallRoom
          roomUrl={videoMeeting.video_room_url}
          onLeave={handleLeaveVideo}
        />
      )}

      {/* Modal crear reunión */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateMeeting}
          minutesRemaining={timerStats?.minutesRemaining ?? 500}
        />
      )}

      {/* Modal asistencia */}
      {attendanceMeeting && (
        <AttendanceModal
          meeting={attendanceMeeting}
          iAmCreator={attendanceMeeting.created_by === userId}
          onSubmit={handleAttendance}
          onClose={() => setAttendanceMeeting(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reuniones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agenda sesiones de estudio con tu compañero</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Proponer
        </button>
      </div>

      {/* Banner: asistencias pendientes */}
      {pendingAttendance.length > 0 && (
        <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⏳</span>
            <p className="text-sm text-amber-800">
              Tienes {pendingAttendance.length} reunión{pendingAttendance.length > 1 ? 'es' : ''} por marcar.
            </p>
          </div>
          <button
            onClick={() => setAttendanceMeeting(pendingAttendance[0])}
            className="shrink-0 text-xs font-semibold text-amber-700 underline"
          >
            Marcar ahora
          </button>
        </div>
      )}

      {/* Panel superior: Timer + Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Cronómetro */}
        {timerStats && (
          <MeetingTimerPanel stats={timerStats} />
        )}

        {/* Estadísticas del mes */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Este mes</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedThisMonth}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{thisMonthMeetings.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {attendanceRate}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Asistencia</p>
            </div>
          </div>

          {/* Reuniones pendientes de respuesta */}
          {meetings.filter(m => m.status === 'pending' && m.partner_id === userId).length > 0 && (
            <div className="mt-4 rounded-xl bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
              📬 Tienes {meetings.filter(m => m.status === 'pending' && m.partner_id === userId).length} propuesta{meetings.filter(m => m.status === 'pending' && m.partner_id === userId).length > 1 ? 's' : ''} esperando tu respuesta.
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-4 w-fit">
        {(['calendar', 'list'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab === 'calendar' ? '📅 Calendario' : '📋 Lista'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Vista Calendario */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <MeetingCalendar
                meetings={meetings}
                onDaySelect={setSelectedDate}
                selectedDate={selectedDate}
              />

              {/* Meetings del día seleccionado */}
              {selectedDate && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 capitalize">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </h3>
                  {meetingsForSelectedDate.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 py-8 text-center text-gray-400">
                      <p className="text-sm">Sin reuniones este día</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2 text-xs text-indigo-500 underline"
                      >
                        Proponer una
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meetingsForSelectedDate.map((m) => (
                        <MeetingCard
                          key={m.id}
                          meeting={m}
                          currentUserId={userId}
                          onConfirm={(id) => confirmMeeting.mutate(id)}
                          onReject={(id) => rejectMeeting.mutate(id)}
                          onCancel={(id) => cancelMeeting.mutate(id)}
                          onMarkAttendance={setAttendanceMeeting}
                          onJoinVideo={setVideoMeeting}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Vista Lista */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Próximas */}
              {upcomingMeetings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Próximas
                  </h3>
                  <div className="space-y-3">
                    {upcomingMeetings.map((m) => (
                      <MeetingCard
                        key={m.id}
                        meeting={m}
                        currentUserId={userId}
                        onConfirm={(id) => confirmMeeting.mutate(id)}
                        onReject={(id) => rejectMeeting.mutate(id)}
                        onCancel={(id) => cancelMeeting.mutate(id)}
                        onMarkAttendance={setAttendanceMeeting}
                        onJoinVideo={setVideoMeeting}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pasadas */}
              {pastMeetings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Historial
                  </h3>
                  <div className="space-y-3">
                    {pastMeetings.slice(0, 10).map((m) => (
                      <MeetingCard
                        key={m.id}
                        meeting={m}
                        currentUserId={userId}
                        onMarkAttendance={setAttendanceMeeting}
                        onJoinVideo={setVideoMeeting}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sin reuniones */}
              {upcomingMeetings.length === 0 && pastMeetings.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
                  <p className="text-4xl mb-3">📅</p>
                  <p className="text-sm font-medium">Sin reuniones aún</p>
                  <p className="text-xs mt-1">Propón la primera sesión de estudio</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Proponer reunión
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
