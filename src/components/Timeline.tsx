import React from 'react';
import { Calendar, Star } from 'lucide-react';
import type { TimelineItem } from '../types';
import './Timeline.css';

interface TimelineProps {
  timeline: TimelineItem[];
}

const Timeline: React.FC<TimelineProps> = ({ timeline }) => {
  return (
    <div className="timeline-section">
      <h3 className="section-title">
        <Calendar size={20} />
        Dòng thời gian lịch sử
      </h3>
      
      <div className="timeline-container">
        {timeline.map((item, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-marker">
              <div className="timeline-year">{item.year}</div>
              <div className="timeline-dot">
                <Star size={12} />
              </div>
            </div>
            
            <div className="timeline-content">
              <h4 className="timeline-event">{item.event}</h4>
              <p className="timeline-description">{item.description}</p>
              <div className="timeline-significance">
                <strong>Ý nghĩa: </strong>
                {item.significance}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
