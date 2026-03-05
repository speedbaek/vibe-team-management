"use client";

interface DailyLogCalendarProps {
  logs: Array<{ date: string }>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export function DailyLogCalendar({
  logs,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: DailyLogCalendarProps) {
  const [year, month] = currentMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const logDates = new Set(
    logs.map((l) => {
      const d = new Date(l.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  const prevMonth = () => {
    const d = new Date(year, month - 2, 1);
    onMonthChange(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    onMonthChange(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="px-2 py-1 hover:bg-accent rounded"
        >
          &lt;
        </button>
        <h3 className="font-semibold">
          {firstDay.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
          })}
        </h3>
        <button
          onClick={nextMonth}
          className="px-2 py-1 hover:bg-accent rounded"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasLog = logDates.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday =
            dateStr === new Date().toISOString().split("T")[0];

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative p-2 text-sm rounded-md transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-accent font-bold"
                    : "hover:bg-accent"
              }`}
            >
              {day}
              {hasLog && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
