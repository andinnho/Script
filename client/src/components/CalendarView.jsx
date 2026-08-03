import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ currentDate, onSelectDate, monthData }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    onSelectDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onSelectDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (dayNum) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNum
    );
  };

  const isSelected = (dayNum) => {
    return (
      currentDate.getFullYear() === year &&
      currentDate.getMonth() === month &&
      currentDate.getDate() === dayNum
    );
  };

  const hasContent = (dayNum) => {
    if (!monthData || !monthData.days) return false;
    const dayObj = monthData.days[dayNum];
    return dayObj && dayObj.text && dayObj.text.trim().length > 0;
  };

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const selected = isSelected(dayNum);
    const todayClass = isToday(dayNum) ? 'today' : '';
    const contentClass = hasContent(dayNum) ? 'has-content' : '';

    cells.push(
      <button
        key={dayNum}
        className={`calendar-day-cell ${selected ? 'selected' : ''} ${todayClass} ${contentClass}`}
        onClick={() => onSelectDate(new Date(year, month, dayNum))}
      >
        {dayNum}
      </button>
    );
  }

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button className="icon-btn" onClick={handlePrevMonth} title="Mês Anterior">
          <ChevronLeft size={16} />
        </button>
        <span className="month-year-label">
          {monthNames[month]} {year}
        </span>
        <button className="icon-btn" onClick={handleNextMonth} title="Próximo Mês">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="calendar-grid">
        {weekdays.map((wd) => (
          <div key={wd} className="calendar-weekday">
            {wd}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}
