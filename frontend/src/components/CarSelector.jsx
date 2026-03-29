import { BRAND_NAMES, getModels } from '../data/cars';

export default function CarSelector({ brand, model, onBrandChange, onModelChange, required = false }) {
  const models = getModels(brand);

  const handleBrandChange = (e) => {
    onBrandChange(e.target.value);
    onModelChange(''); // reset model when brand changes
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div className="input-group">
        <label className="input-label">Марка авто {required && '*'}</label>
        <select className="input" value={brand} onChange={handleBrandChange}>
          <option value="">— Оберіть марку —</option>
          {BRAND_NAMES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Модель {required && brand && '*'}</label>
        <select className="input" value={model} onChange={e => onModelChange(e.target.value)} disabled={!brand}>
          <option value="">— Оберіть модель —</option>
          {models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
