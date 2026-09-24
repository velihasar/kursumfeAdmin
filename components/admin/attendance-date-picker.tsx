"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

interface CourseDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  daysOfWeek?: string; // e.g. "Pazartesi, Çarşamba, Cuma"
  startTime?: string;
  endTime?: string;
  disabled?: boolean;
}

const TURKISH_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const DAY_NAME_TO_INDEX: Record<string, number> = {
  pazar: 0,
  sunday: 0,
  pazartesi: 1,
  monday: 1,
  salı: 2,
  sali: 2,
  tuesday: 2,
  çarşamba: 3,
  carsamba: 3,
  wednesday: 3,
  perşembe: 4,
  persembe: 4,
  thursday: 4,
  cuma: 5,
  friday: 5,
  cumartesi: 6,
  saturday: 6,
};

export function parseCourseDays(daysOfWeek?: string): number[] {
  if (!daysOfWeek || !daysOfWeek.trim()) return [];
  const parts = daysOfWeek
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const indices: number[] = [];
  for (const part of parts) {
    if (DAY_NAME_TO_INDEX[part] !== undefined) {
      indices.push(DAY_NAME_TO_INDEX[part]);
    }
  }
  return indices;
}

export function AttendanceDatePicker({
  value,
  onChange,
  daysOfWeek,
  startTime,
  endTime,
  disabled = false,
}: CourseDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse allowed day indices (0: Sun, 1: Mon, ..., 6: Sat)
  const allowedDayIndices = useMemo(() => parseCourseDays(daysOfWeek), [daysOfWeek]);

  // Current view month & year for the calendar
  const initialDate = value ? new Date(value + "T00:00:00") : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedDateObj = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value + "T00:00:00");
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const isCurrentSelectionValid = useMemo(() => {
    if (!allowedDayIndices.length) return true;
    return allowedDayIndices.includes(selectedDateObj.getDay());
  }, [allowedDayIndices, selectedDateObj]);

  // Previous & Next month handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
    // We want Monday = 0, Sunday = 6 for our grid
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        dateStr: formatDateToString(date),
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        dateStr: formatDateToString(date),
      });
    }

    // Next month padding to fill full 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        dateStr: formatDateToString(date),
      });
    }

    return days;
  }, [viewDate]);

  function formatDateToString(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Quick shortcut dates (recent & today valid course days)
  const quickDates = useMemo(() => {
    const list: { dateStr: string; label: string; isToday: boolean }[] = [];
    const today = new Date();
    const todayStr = formatDateToString(today);

    const runner = new Date(today);
    // Scan up to 30 days back to find last 4 valid course days
    for (let i = 0; i < 30 && list.length < 4; i++) {
      const dayOfWeek = runner.getDay();
      if (!allowedDayIndices.length || allowedDayIndices.includes(dayOfWeek)) {
        const dStr = formatDateToString(runner);
        const isToday = dStr === todayStr;
        const dayName = runner.toLocaleDateString("tr-TR", { weekday: "short" });
        const monthDay = runner.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

        list.push({
          dateStr: dStr,
          label: isToday ? `Bugün (${dayName})` : `${monthDay} ${dayName}`,
          isToday,
        });
      }
      runner.setDate(runner.getDate() - 1);
    }
    return list;
  }, [allowedDayIndices]);

  const selectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!value) return "Tarih Seçiniz";
    return selectedDateObj.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  }, [value, selectedDateObj]);

  const todayStr = formatDateToString(new Date());

  return (
    <div className="relative z-30 space-y-1.5" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg border bg-background transition-all cursor-pointer select-none shadow-xs ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-muted"
            : "hover:border-primary hover:bg-accent/40"
        } ${isOpen ? "ring-2 ring-primary/30 border-primary" : "border-input"} ${
          !isCurrentSelectionValid ? "border-amber-400 bg-amber-50/20" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col text-left truncate">
            <span className="font-semibold text-foreground truncate">{formattedDisplay}</span>
            {daysOfWeek ? (
              <span className="text-[10px] text-muted-foreground truncate">
                {isCurrentSelectionValid ? (
                  <span className="text-emerald-600 font-medium">✓ Ders Günü</span>
                ) : (
                  <span className="text-amber-600 font-medium">⚠️ Ders Günü Değil</span>
                )}
                {startTime ? ` • ${startTime} - ${endTime}` : ""}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Tüm günler serbest</span>
            )}
          </div>
        </div>

        <Badge
          variant={isCurrentSelectionValid ? "secondary" : "outline"}
          className={`text-[10px] font-medium shrink-0 ${
            !isCurrentSelectionValid
              ? "text-amber-700 bg-amber-100/80 border-amber-300"
              : "text-primary bg-primary/10"
          }`}
        >
          Değiştir
        </Badge>
      </div>

      {/* Warning when a non-course day is selected */}
      {!isCurrentSelectionValid && (
        <div className="flex items-center justify-between text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-1.5 px-2">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">
              Seçili gün ({daysOfWeek || "kurs programı"}) dışındadır.
            </span>
          </div>
          {quickDates.length > 0 && (
            <button
              type="button"
              onClick={() => onChange(quickDates[0].dateStr)}
              className="text-[11px] font-semibold text-primary underline ml-2 shrink-0 hover:text-primary/80"
            >
              Ders gününe ayarla
            </button>
          )}
        </div>
      )}

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-3 text-popover-foreground shadow-2xl ring-1 ring-black/10 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Quick Dates Carousel / Chips */}
          {quickDates.length > 0 && (
            <div className="mb-3 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Hızlı Ders Tarihleri
              </div>
              <div className="flex flex-wrap gap-1">
                {quickDates.map((q) => {
                  const isSelected = q.dateStr === value;
                  return (
                    <Button
                      key={q.dateStr}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectDate(q.dateStr)}
                      className={`h-6 text-[11px] px-2 py-0 rounded-md font-normal transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : q.isToday
                          ? "border-emerald-500/50 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "hover:bg-accent"
                      }`}
                    >
                      {q.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month & Year Navigation Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-semibold capitalize text-foreground">
              {viewDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Headers (Pzt ... Paz) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground my-2">
            {TURKISH_DAYS.map((day, idx) => (
              <div key={day} className={`py-0.5 ${idx >= 5 ? "text-rose-500/80" : ""}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((item, index) => {
              const dayOfWeek = item.date.getDay();
              const isAllowed =
                !allowedDayIndices.length || allowedDayIndices.includes(dayOfWeek);
              const isSelected = item.dateStr === value;
              const isToday = item.dateStr === todayStr;

              // If day is not allowed for this course, disable it
              const isDisabled = !isAllowed || !item.isCurrentMonth;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDate(item.dateStr)}
                  className={`h-7 w-full rounded-md text-xs font-medium flex items-center justify-center relative transition-all ${
                    !item.isCurrentMonth
                      ? "opacity-20 cursor-not-allowed text-muted-foreground"
                      : !isAllowed
                      ? "opacity-25 cursor-not-allowed bg-muted/30 text-muted-foreground line-through"
                      : isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs scale-105"
                      : isToday
                      ? "border border-primary/60 text-primary font-bold hover:bg-primary/10"
                      : "hover:bg-accent text-foreground hover:text-accent-foreground"
                  }`}
                  title={
                    !isAllowed
                      ? "Bu tarihte kurs dersi bulunmuyor"
                      : item.date.toLocaleDateString("tr-TR")
                  }
                >
                  {item.date.getDate()}
                  {isToday && !isSelected && isAllowed && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Course Schedule Information Footer */}
          <div className="mt-3 pt-2.5 border-t border-border/60 text-[10px] text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-1 truncate">
              <Clock className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate">
                {daysOfWeek ? `Ders Günleri: ${daysOfWeek}` : "Tüm günler seçilebilir"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-medium text-foreground hover:underline ml-2"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
