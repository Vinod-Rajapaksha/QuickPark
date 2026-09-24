import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import NotificationList from "../../features/notifications/components/NotificationList";
import { useNotifications } from "../../features/notifications/hooks/useNotifications";
import { bellLabel } from "../../features/notifications/utils/notificationUtils";

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadError,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const closeOnClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnClickOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={bellLabel(unreadCount)}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 max-h-[28rem] w-[22rem] overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            error={loadError}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onRefresh={refresh}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
