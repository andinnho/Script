import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Info } from 'lucide-react';
import { getFeriadoInfo } from '../utils/feriadosHelper';

export default function CalendarView({ currentDate, onSelectDate, monthData }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [activeTooltip, setActiveTooltip] = useState(null); // { dayNum, holidayInfo, rect }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekdays = [
    { label: 'Dom', isWeekend: true },
    { label: 'Seg', isWeekend: false },
    { label: 'Ter', isWeekend: false },
    { label: 'Qua', isWeekend: false },
    { label: 'Qui', isWeekend: false },
    { label: 'Sex', isWeekend: false },
    { label: 'Sáb', isWeekend: true }
  ];

  // Dynamic Year range (e.g. 2000 to 2035)
  const yearOptions = useMemo(() => {
    const start = 2000;
    const end = 2035;
    const list = [];
    for (let y = start; y <= end; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    onSelectDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onSelectDate(new Date(year, month + 1, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    onSelectDate(new Date(year, newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    onSelectDate(new Date(newYear, month, 1));
  };

  const handleTodayClick = () => {
    onSelectDate(new Date());
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
    const dateObj = new Date(year, month, dayNum);
    const dayOfWeek = dateObj.getDay();
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

    const selected = isSelected(dayNum);
    const todayClass = isToday(dayNum) ? 'today' : '';
    const contentClass = hasContent(dayNum) ? 'has-content' : '';
    const weekendClass = isWeekendDay ? 'is-weekend' : '';

    const holidayInfo = getFeriadoInfo(year, month, dayNum);
    const holidayClass = holidayInfo ? `has-holiday holiday-${holidayInfo.tipo}` : '';

    cells.push(
      <div
        key={dayNum}
        className="calendar-day-wrapper"
        onMouseEnter={(e) => {
          if (holidayInfo) {
            const rect = e.currentTarget.getBoundingClientRect();
            setActiveTooltip({ dayNum, holidayInfo, rect });
          }
        }}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          type="button"
          className={`calendar-day-cell ${selected ? 'selected' : ''} ${todayClass} ${contentClass} ${weekendClass} ${holidayClass}`}
          onClick={() => onSelectDate(new Date(year, month, dayNum))}
          onFocus={(e) => {
            if (holidayInfo) {
              const rect = e.currentTarget.parentElement.getBoundingClientRect();
              setActiveTooltip({ dayNum, holidayInfo, rect });
            }
          }}
          onBlur={() => setActiveTooltip(null)}
          title={holidayInfo ? `${dayNum} - ${holidayInfo.nome} (${holidayInfo.classificacao})` : undefined}
        >
          <span>{dayNum}</span>

          {/* Holiday Dot Badge */}
          {holidayInfo && (
            <span className={`holiday-dot ${holidayInfo.tipo}`} />
          )}
        </button>

        {/* Hover / Focus Floating Tooltip */}
        {activeTooltip && activeTooltip.dayNum === dayNum && (
          <div className="calendar-tooltip" role="tooltip">
            <div className="tooltip-header">
              <Info size={13} className="tooltip-icon" />
              <span className="tooltip-title">{activeTooltip.holidayInfo.nome}</span>
            </div>
            
            <div className="tooltip-body">
              <span className={`tooltip-badge ${activeTooltip.holidayInfo.tipo}`}>
                {activeTooltip.holidayInfo.classificacao}
              </span>

              {activeTooltip.holidayInfo.municipio && (
                <span className="tooltip-location">
                  📍 {activeTooltip.holidayInfo.municipio}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-card">
      {/* Top Header Controls */}
      <div className="calendar-header">
        <div className="calendar-nav-group">
          <button className="icon-btn" onClick={handlePrevMonth} title="Mês Anterior">
            <ChevronLeft size={16} />
          </button>

          {/* Selectors for Month and Year */}
          <div className="calendar-selectors">
            <select
              className="calendar-select month-select"
              value={month}
              onChange={handleMonthChange}
              title="Selecionar Mês"
            >
              {monthNames.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              className="calendar-select year-select"
              value={year}
              onChange={handleYearChange}
              title="Selecionar Ano"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button className="icon-btn" onClick={handleNextMonth} title="Próximo Mês">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Quick Jump "Hoje" Button */}
        <button
          type="button"
          className="calendar-today-btn"
          onClick={handleTodayClick}
          title="Ir para a data atual (Hoje)"
        >
          <CalendarDays size={13} />
          <span>Hoje</span>
        </button>
      </div>

      {/* Days Grid */}
      <div className="calendar-grid">
        {weekdays.map((wd) => (
          <div key={wd.label} className={`calendar-weekday ${wd.isWeekend ? 'is-weekend' : ''}`}>
            {wd.label}
          </div>
        ))}
        {cells}
      </div>
    </div>
  );
}
