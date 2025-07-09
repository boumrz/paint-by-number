import { memo } from 'react';

export const GenerateInstructionGrid = memo(({ gridCols, gridRows, total, setSelectedSquare, setShowColorModal }) => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          width: '100%',
          height: '100%',
          gap: 0,
          position: 'relative',
        }}
      >
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx + 1}
            style={{
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#000',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onClick={() => {
              setSelectedSquare(idx + 1);
              setShowColorModal(true);
            }}
            title={`Сектор ${idx + 1} - кликните для просмотра цветов`}
          >
            <div>{idx + 1}</div>
          </div>
        ))}
      </div>
    );
  });

  GenerateInstructionGrid.displayName = 'GenerateInstructionGrid';