import { Switch } from "antd";

const labelStyle = {
    fontWeight: 500,
    fontSize: 16,
    color: '#333',
    margin: '0 10px',
    transition: 'color 0.2s',
};

export default function OrientationSwitch({ orientation, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...labelStyle, color: orientation === 'vertical' ? '#1890ff' : '#888' }}>Вертикально</span>
            <Switch
                checked={orientation === 'horizontal'}
                onChange={checked => onChange(checked ? 'horizontal' : 'vertical')}
                style={{ background: orientation === 'horizontal' ? '#1890ff' : '#e0e0e0', boxShadow: '0 2px 8px rgba(24,144,255,0.08)' }}
                size="default"
            />
            <span style={{ ...labelStyle, color: orientation === 'horizontal' ? '#1890ff' : '#888' }}>Горизонтально</span>
        </div>
    );
} 