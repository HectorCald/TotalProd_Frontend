import React from 'react';

const LayoutPercentage = ({ percentages = [65, 35], gap = '24px', alignItems = 'stretch', children }) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div style={{ display: 'flex', gap: gap, width: '100%', alignItems: alignItems }}>
      {childrenArray.map((child, index) => {
        const flexValue = percentages[index] || 1;
        return (
          <div key={index} style={{ flex: `${flexValue} ${flexValue} 0%`, minWidth: 0, overflow: 'hidden' }}>
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default LayoutPercentage;
