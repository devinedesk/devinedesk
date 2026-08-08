'use client';

import React from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parse } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Calendar({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-lg font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-medium text-sm text-gray-400 py-2">
          {format(addDays(startDate, i), 'E')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        days.push(
          <div
            key={day}
            className={`p-2 flex justify-center items-center cursor-pointer rounded-md transition-colors ${
              !isCurrentMonth ? 'text-gray-600' : isSelected ? 'bg-cyan-500 text-black font-bold' : 'text-gray-200 hover:bg-white/10'
            }`}
            onClick={() => onSelectDate && onSelectDate(cloneDay)}
          >
            <span className="w-8 h-8 flex items-center justify-center">{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="p-4 bg-app-bg border border-white/10 rounded-xl w-full max-w-sm">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
