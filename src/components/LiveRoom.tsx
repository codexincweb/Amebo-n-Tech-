"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createLocalAudioTrack,
  Room,
  RoomEvent,
  Track
} from "livekit-client";

type LiveState = {
  active: boolean;
  title: string;
  startedAt: string | null;
};

type SpeakerRequest = {
  identity: string;
  name: string;
  requestedAt: string;
};

type TokenResponse = {
  token: string;
  serverUrl: string;
  identity: string;
  isHost: boolean;
  canPublish: boolean;
  listenerTicket: string | null;
  error?: string;
};

const DEFAULT_STATE: LiveState = {
  active: false,
  title: "Amebo 'n Tech Live",
  startedAt: null
};

export default function LiveRoom() {
  const [state, setState] = useState<LiveState>(DEFAULT_STATE);
  const [name, setName] = useState("");
  const [host, setHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isHostParticipant, setIsHostParticipant] = useState(false);
  const [canPublish, setCanPublish] = useState(false);
  const [muted, setMuted] = useState(false);
  const [requests, setRequests] = useState<SpeakerRequest[]>([]);
  const [ticket, setTicket] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [titleInput, setTitleInput] = useState("Amebo 'n Tech Live");
  const [meetingParticipants, setMeetingParticipants] = useState<
    Array<{ identity: string; name: string; local: boolean; speaking: boolean }>
  >([]);
  const roomRef = useRef<Room | null>(null);
  const audioTrackRef = useRef<Awaited<
    ReturnType<typeof createLocalAudioTrack>
  > | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/live/status", {
        cache: "no-store"
      });
      if (!response.ok) return;
      const data = await response.json();
      setState({
        active: Boolean(data.active),
        title: data.title || "Amebo 'n Tech Live",
        startedAt: data.startedAt ?? null
      });
    } catch {
      // Keep the last known status when the network is temporarily unavailable.
    }
  }, []);

  const refreshHost = useCallback(async () => {
    try {
      const response = await fetch("/api/live/host", {
        cache: "no-store"
      });
      if (!response.ok) {
        setHost(false);
        return;
      }
      const data = await response.json();
      setHost(true);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch {
      setHost(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
    void refreshHost();

    const statusTimer = window.setInterval(() => {
      void refreshStatus();
    }, 5000);

    const hostTimer = window.setInterval(() => {
      void refreshHost();
    }, 4000);

    return () => {
      window.clearInterval(statusTimer);
      window.clearInterval(hostTimer);
    };
  }, [refreshStatus, refreshHost]);

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;

    if (room) {
      room.removeAllListeners();
      await room.disconnect();
    }

    if (audioTrackRef.current) {
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }

    for (const element of audioElementsRef.current) {
      element.pause();
      element.srcObject = null;
      element.remove();
    }
    audioElementsRef.current = [];

    setConnected(false);
    setCanPublish(false);
    setMuted(false);
    setIsHostParticipant(false);
    setMeetingParticipants([]);
  }, []);

  useEffect(() => {
    return () => {
      const room = roomRef.current;
      roomRef.current = null;

      if (room) {
        room.removeAllListeners();
        void room.disconnect();
      }

      audioTrackRef.current?.stop();

      for (const element of audioElementsRef.current) {
        element.pause();
        element.srcObject = null;
        element.remove();
      }
    };
  }, []);

  const joinRoom = useCallback(async (
    suppliedTicket = ticket,
    hostMode = false,
    force = false
  ) => {
    if ((busy || connected) && !force) return;

    if (!hostMode && !name.trim() && !suppliedTicket) {
      setMessage("Enter your display name before joining.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const tokenResponse = await fetch("/api/live/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim() || "Amebo Host",
          ...(suppliedTicket ? { ticket: suppliedTicket } : {})
        })
      });

      const tokenData = (await tokenResponse.json()) as TokenResponse;

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || "Could not join the room.");
      }

      const room = new Room({
        adaptiveStream: false,
        dynacast: false
      });

      room.on(
        RoomEvent.TrackSubscribed,
        (track) => {
          if (track.kind !== Track.Kind.Audio) return;

          const element = track.attach() as HTMLAudioElement;
          element.autoplay = true;
          element.setAttribute("playsinline", "true");
          document.body.appendChild(element);
          audioElementsRef.current.push(element);

          void element.play().catch(() => {
            setMessage(
              "You're connected. If you cannot hear audio, tap the page and check your device volume."
            );
          });
        }
      );

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        const elements = track.detach();
        for (const element of elements) {
          element.pause();
          element.srcObject = null;
          element.remove();

          audioElementsRef.current = audioElementsRef.current.filter(
            (item) => item !== element
          );
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === room) {
          roomRef.current = null;
          audioTrackRef.current = null;
          setConnected(false);
          setCanPublish(false);
          setMuted(false);
          setIsHostParticipant(false);
          setMeetingParticipants([]);
          setMessage("Disconnected from the live room.");
        }
      });

      await room.connect(tokenData.serverUrl, tokenData.token);
      roomRef.current = room;

      const syncMeetingParticipants = (activeSpeakers: string[] = []) => {
        const speakingIdentities = new Set(activeSpeakers);

        const participants = [
          {
            identity: room.localParticipant.identity,
            name: room.localParticipant.name || name.trim() || "You",
            local: true,
            speaking:
              room.localParticipant.isSpeaking ||
              speakingIdentities.has(room.localParticipant.identity),
          },
          ...Array.from(room.remoteParticipants.values()).map((participant) => ({
            identity: participant.identity,
            name: participant.name || participant.identity || "Participant",
            local: false,
            speaking:
              participant.isSpeaking ||
              speakingIdentities.has(participant.identity),
          })),
        ];

        setMeetingParticipants(participants);
      };

      const updateMeetingParticipants = () => {
        syncMeetingParticipants(
          room.activeSpeakers.map((participant) => participant.identity)
        );
      };

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        syncMeetingParticipants(
          speakers.map((participant) => participant.identity)
        );
      });
      room.on(RoomEvent.ParticipantConnected, updateMeetingParticipants);
      room.on(RoomEvent.ParticipantDisconnected, updateMeetingParticipants);
      room.on(RoomEvent.ParticipantNameChanged, updateMeetingParticipants);

      syncMeetingParticipants(
        room.activeSpeakers.map((participant) => participant.identity)
      );

      let microphoneReady = false;

      if (tokenData.canPublish) {
        try {
          const microphone = await createLocalAudioTrack();
          await room.localParticipant.publishTrack(microphone);
          audioTrackRef.current = microphone;
          microphoneReady = true;
        } catch {
          setMessage(
            "Connected, but microphone access failed. Check your browser permissions and try reconnecting."
          );
        }
      }

      if (tokenData.listenerTicket) {
        setTicket(tokenData.listenerTicket);
        try {
          sessionStorage.setItem(
            "amebo-live-ticket",
            tokenData.listenerTicket
          );
        } catch {
          // The current session can still continue without session storage.
        }
      }

      setConnected(true);
      setCanPublish(microphoneReady);
      setIsHostParticipant(tokenData.isHost);
      if (microphoneReady) {
        setMessage("You're connected and your microphone is live.");
      } else if (tokenData.canPublish) {
        setMessage(
          "Connected, but microphone access failed. Check your browser permissions and reconnect to try again."
        );
      } else {
        setMessage("You're listening live. You can request permission to speak.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not connect to the live room."
      );
    } finally {
      setBusy(false);
    }
  }, [busy, connected, name, ticket]);

  useEffect(() => {
    try {
      const savedTicket = sessionStorage.getItem("amebo-live-ticket");
      if (savedTicket) setTicket(savedTicket);
    } catch {
      // Session storage may be disabled by the browser.
    }
  }, []);

  const hostAction = async (action: "start" | "end") => {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/live/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title: titleInput.trim() || "Amebo 'n Tech Live"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Host action failed.");
      }

      setMessage(
        action === "start"
          ? "The live room is open. Join it to start broadcasting."
          : "The live session has ended."
      );

      if (action === "end") {
        await disconnect();
      }

      await refreshStatus();
      await refreshHost();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Host action failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSpeakerRequest = async () => {
    if (!ticket) {
      setMessage("Your listener session is missing. Leave and rejoin first.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/live/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not request to speak.");
      }

      setMessage(data.message || "Your request has been sent to the host.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Request failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const checkSpeakerApproval = async () => {
    if (!ticket || !connected) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/live/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket }),
        cache: "no-store"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not check approval.");
      }

      if (!data.canPublish) {
        setMessage("Your request is still pending, or it was not approved.");
        return;
      }

      await disconnect();
      setMessage("Your request was approved. Reconnecting with microphone access.");
      await joinRoom(ticket, false, true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not check approval."
      );
    } finally {
      setBusy(false);
    }
  };

  const processRequest = async (
    identity: string,
    action: "approve" | "deny"
  ) => {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/live/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, action })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not process request.");
      }

      setMessage(
        action === "approve"
          ? "Speaker approved. They can now check their permission to speak."
          : "Speaker request denied."
      );
      await refreshHost();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not process request."
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleMicrophone = async () => {
    const microphone = audioTrackRef.current;
    if (!microphone) {
      setMessage("Your microphone is not available. Rejoin and allow microphone access.");
      return;
    }

    try {
      if (muted) {
        await microphone.unmute();
        setMuted(false);
      } else {
        await microphone.mute();
        setMuted(true);
      }
    } catch {
      setMessage("Could not change your microphone state.");
    }
  };

  const shareRoom = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Live-room link copied. Share it with your audience.");
    } catch {
      setMessage(`Share this link: ${url}`);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Join Amebo 'n Tech Live: ${typeof window !== "undefined" ? window.location.href : "https://amebontech.vercel.app/live"}`
  )}`;

  return (
    <main className="site-container py-10 sm:py-16">
      <style jsx>{`
        .amebo-meeting-stage {
          padding: 1.1rem;
          border: 1px solid #263449;
          border-radius: 1.25rem;
          color: #f8fafc;
          background: radial-gradient(ellipse at top, #26364c 0%, #111827 72%);
        }
        .amebo-live-pill {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          border: 1px solid #365a4b;
          border-radius: 999px;
          padding: .35rem .6rem;
          color: #bbf7d0;
          font-size: .68rem;
          font-weight: 800;
          letter-spacing: .08em;
        }
        .amebo-live-pill > span {
          width: .45rem;
          height: .45rem;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 0 3px #4ade8022;
        }
        .amebo-participant-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
          gap: .7rem;
        }
        .amebo-participant-tile {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 145px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .65rem;
          overflow: hidden;
          border: 1px solid #39465a;
          border-radius: 1rem;
          padding: 1rem .5rem .8rem;
          background: #1e293b;
          transition: border-color .2s, background .2s;
        }
        .amebo-participant-tile.is-speaking {
          border-color: #4ade80;
          background: #203a38;
        }
        .amebo-avatar-wrap {
          position: relative;
          display: grid;
          place-items: center;
        }
        .amebo-avatar {
          display: grid;
          width: 3.7rem;
          height: 3.7rem;
          place-items: center;
          border: 1px solid #64748b;
          border-radius: 50%;
          background: linear-gradient(145deg, #475569, #334155);
          color: #fff;
          font-size: 1.5rem;
          font-weight: 750;
        }
        .is-speaking .amebo-avatar {
          border-color: #86efac;
          background: linear-gradient(145deg, #15803d, #166534);
        }
        .amebo-speaking-ring {
          position: absolute;
          inset: -.35rem;
          border: 2px solid #4ade80;
          border-radius: 50%;
          animation: amebo-ring 1.6s ease-out infinite;
          pointer-events: none;
        }
        .amebo-participant-name {
          max-width: 100%;
          overflow-wrap: anywhere;
          color: #f1f5f9;
          font-size: .8rem;
          font-weight: 650;
          text-align: center;
        }
        .amebo-speaking-bars {
          display: flex;
          height: 12px;
          align-items: center;
          gap: 3px;
          opacity: .25;
        }
        .amebo-speaking-bars span {
          width: 3px;
          height: 4px;
          border-radius: 4px;
          background: #86efac;
        }
        .is-speaking .amebo-speaking-bars {
          opacity: 1;
        }
        .is-speaking .amebo-speaking-bars span {
          animation: amebo-wave .65s ease-in-out infinite alternate;
        }
        .is-speaking .amebo-speaking-bars span:nth-child(2) { animation-delay: .12s; }
        .is-speaking .amebo-speaking-bars span:nth-child(3) { animation-delay: .25s; }
        .is-speaking .amebo-speaking-bars span:nth-child(4) { animation-delay: .08s; }
        .is-speaking .amebo-speaking-bars span:nth-child(5) { animation-delay: .32s; }
        .amebo-meeting-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: .65rem;
          border-top: 1px solid #39465a;
          padding-top: 1.1rem;
        }
        .amebo-control-button {
          display: inline-flex;
          min-height: 54px;
          min-width: 68px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .3rem;
          border: 1px solid #475569;
          border-radius: 1rem;
          padding: .55rem .9rem;
          background: #334155;
          color: #f8fafc;
          font-size: .72rem;
          font-weight: 650;
          cursor: pointer;
          transition: background .15s, transform .15s;
        }
        .amebo-control-button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        .amebo-control-button:active:not(:disabled) { transform: scale(.97); }
        .amebo-control-button svg {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .amebo-control-button.is-muted { background: #7f1d1d; border-color: #b91c1c; }
        .amebo-control-button.amebo-leave-button {
          min-width: 78px;
          border-color: #dc2626;
          background: #dc2626;
          color: white;
        }
        @keyframes amebo-wave {
          from { height: 3px; }
          to { height: 12px; }
        }
        @keyframes amebo-ring {
          0% { opacity: .7; transform: scale(.94); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        @media (max-width: 420px) {
          .amebo-meeting-stage { padding: .8rem; }
          .amebo-participant-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .amebo-control-button { flex: 1 1 72px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .amebo-speaking-ring, .is-speaking .amebo-speaking-bars span {
            animation: none;
          }
        }
      `}</style>

      <section className="info-hero live-hero overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">AMEBO ’N TECH · LIVE AUDIO</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className={state.active ? "badge-live" : "badge-draft"}>
              <span
                aria-hidden="true"
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ background: state.active ? "#4d8b35" : "#a8a29e" }}
              />
              {state.active ? "LIVE NOW" : "OFFLINE"}
            </span>
            <span className="text-sm text-stone-500">
              Listen, learn, and join the conversation.
            </span>
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            {state.title}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
            Join our live technology conversations. Listen in, raise your hand,
            and speak when the host gives you permission.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" className="button-secondary" onClick={shareRoom}>
              Copy live link
            </button>
            <a
              className="button-secondary"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="panel mt-6 p-4 text-sm leading-6 text-stone-700"
        >
          {message}
        </div>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <section className="panel p-5 sm:p-8">
          <p className="eyebrow">THE AUDIO ROOM</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            {connected ? "You're in the room" : "Join the conversation"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-500">
            {connected
              ? isHostParticipant
                ? "Your host connection is active."
                : canPublish
                  ? "You have permission to speak."
                  : "Your audio is connected in listener mode."
              : state.active
                ? "Enter your display name to join the live session."
                : "The room is not live yet. You can share this page and return when the host starts."}
          </p>

          {!connected && (
            <div className="mt-6">
              <label htmlFor="live-name" className="field-label">
                Display name
              </label>
              <input
                id="live-name"
                className="field mt-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={50}
                placeholder="Enter your name"
                autoComplete="name"
              />
              <button
                type="button"
                className="button-primary mt-4 w-full sm:w-auto"
                disabled={!state.active || busy}
                onClick={() => void joinRoom(ticket, false)}
              >
                {busy ? "Connecting…" : "Join live audio"}
              </button>
            </div>
          )}

          {connected && (
            <div className="amebo-meeting-stage mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  Live conversation
                </span>
                <span className="amebo-live-pill">
                  <span aria-hidden="true" /> CONNECTED
                </span>
              </div>

              <div className="amebo-participant-grid mt-5" aria-label="Room participants">
                {meetingParticipants.map((person) => (
                  <div
                    key={person.identity}
                    className={`amebo-participant-tile${person.speaking ? " is-speaking" : ""}`}
                    aria-label={`${person.name}${person.speaking ? ", speaking" : ""}`}
                  >
                    <div className="amebo-avatar-wrap">
                      <div className="amebo-avatar" aria-hidden="true">
                        {(person.name.trim().charAt(0) || "?").toUpperCase()}
                      </div>
                      {person.speaking && (
                        <span className="amebo-speaking-ring" aria-hidden="true" />
                      )}
                    </div>
                    <span className="amebo-participant-name">
                      {person.name}{person.local ? " (You)" : ""}
                    </span>
                    <div className="amebo-speaking-bars" aria-label={person.speaking ? "Speaking" : "Not speaking"}>
                      {[0, 1, 2, 3, 4].map((bar) => (
                        <span key={bar} />
                      ))}
                    </div>
                  </div>
                ))}
                {meetingParticipants.length === 0 && (
                  <div className="amebo-participant-tile">
                    <div className="amebo-avatar" aria-hidden="true">
                      {(name.trim().charAt(0) || "Y").toUpperCase()}
                    </div>
                    <span className="amebo-participant-name">{name.trim() || "You"}</span>
                  </div>
                )}
              </div>

              <div className="amebo-meeting-toolbar mt-6">
                {canPublish && (
                  <button
                    type="button"
                    className={`amebo-control-button${muted ? " is-muted" : ""}`}
                    onClick={() => void toggleMicrophone()}
                    disabled={busy}
                    aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                    title={muted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {muted ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9V6a3 3 0 0 0-5.83-.9M5 10v2a7 7 0 0 0 11.9 4.95M12 19v3m-4 0h8M3 3l18 18M19 10v2a7 7 0 0 1-.3 2" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="9" y="2" width="6" height="12" rx="3" />
                        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" />
                      </svg>
                    )}
                    <span>{muted ? "Unmute" : "Mute"}</span>
                  </button>
                )}

                {!canPublish && !isHostParticipant && (
                  <>
                    <button
                      type="button"
                      className="amebo-control-button"
                      onClick={() => void handleSpeakerRequest()}
                      disabled={busy}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3v18M3 12h18" />
                      </svg>
                      <span>Request to speak</span>
                    </button>
                    <button
                      type="button"
                      className="amebo-control-button"
                      onClick={() => void checkSpeakerApproval()}
                      disabled={busy}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 11.5a8 8 0 1 1-2.35-5.65M20 4v6h-6M8 12l2.5 2.5L20 5" />
                      </svg>
                      <span>Check approval</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="amebo-control-button amebo-leave-button"
                  onClick={() => void disconnect()}
                  disabled={busy}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 17l5-5-5-5M15 12H3M13 3h5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-5" />
                  </svg>
                  <span>Leave</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-stone-50 p-4 sm:p-5">
            <h3 className="font-semibold">How speaking works</h3>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
              <li>1. Join the live room to listen.</li>
              <li>2. Select “Request to speak” when you want to contribute.</li>
              <li>3. Wait for the host to approve your request.</li>
              <li>4. Select “Check approval” to reconnect with microphone access.</li>
            </ol>
          </div>
        </section>

        {host ? (
          <section className="panel p-5 sm:p-7">
            <p className="eyebrow">HOST CONTROLS</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Manage the session
            </h2>
            <label htmlFor="live-title" className="field-label mt-6">
              Session title
            </label>
            <input
              id="live-title"
              className="field mt-2"
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
              maxLength={120}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              {!state.active ? (
                <button
                  type="button"
                  className="button-primary"
                  disabled={busy}
                  onClick={() => void hostAction("start")}
                >
                  Start live session
                </button>
              ) : (
                <button
                  type="button"
                  className="button-danger"
                  disabled={busy}
                  onClick={() => void hostAction("end")}
                >
                  End live session
                </button>
              )}

              {state.active && !connected && (
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy}
                  onClick={() => void joinRoom("", true)}
                >
                  Join as host
                </button>
              )}
            </div>

            <div className="mt-8 border-t border-stone-200 pt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Speaker requests</h3>
                <span className="comments-count">{requests.length} pending</span>
              </div>

              {requests.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-stone-500">
                  No pending requests. New requests will appear here automatically.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {requests.map((speaker) => (
                    <li
                      key={speaker.identity}
                      className="rounded-xl border border-stone-200 p-4"
                    >
                      <p className="font-semibold">{speaker.name}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Requested{" "}
                        {new Date(speaker.requestedAt).toLocaleTimeString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="button-primary"
                          disabled={busy}
                          onClick={() =>
                            void processRequest(speaker.identity, "approve")
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="button-secondary"
                          disabled={busy}
                          onClick={() =>
                            void processRequest(speaker.identity, "deny")
                          }
                        >
                          Deny
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : (
          <aside className="panel p-5 sm:p-7">
            <p className="eyebrow">JOIN US</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              Stay connected
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              Share the room with your friends, classmates, and fellow tech
              enthusiasts. Anyone with the link can visit the page and listen
              while a session is live.
            </p>
            <a
              className="button-primary mt-5"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              Invite people
            </a>
          </aside>
        )}
      </div>
    </main>
  );
}
