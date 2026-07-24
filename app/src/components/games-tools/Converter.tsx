import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';

interface ConverterProps {
  onBack: () => void;
}

type UnitDef = { label: string; factor: number };
type Category = {
  id: string;
  label: string;
  base: string;
  units: Record<string, UnitDef>;
};

function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === 'c') celsius = value;
  else if (from === 'f') celsius = (value - 32) * (5 / 9);
  else celsius = value - 273.15;

  if (to === 'c') return celsius;
  if (to === 'f') return celsius * (9 / 5) + 32;
  return celsius + 273.15;
}

function convertValue(value: number, from: string, to: string, categoryId: string, units: Record<string, UnitDef>): number {
  if (categoryId === 'temperature') {
    return convertTemperature(value, from, to);
  }
  const fromFactor = units[from]?.factor ?? 1;
  const toFactor = units[to]?.factor ?? 1;
  const baseValue = value * fromFactor;
  return baseValue / toFactor;
}

function formatNumber(num: number): string {
  if (num === 0) return '0';
  const abs = Math.abs(num);
  if (abs < 1e-6 || abs >= 1e12) {
    return num.toExponential(6);
  }
  const str = num.toPrecision(12);
  return parseFloat(str).toString();
}

export function Converter({ onBack }: ConverterProps) {
  const categories: Category[] = useMemo(() => [
    {
      id: 'length',
      label: 'Length',
      base: 'm',
      units: {
        mm: { label: 'Millimeter (mm)', factor: 0.001 },
        cm: { label: 'Centimeter (cm)', factor: 0.01 },
        m: { label: 'Meter (m)', factor: 1 },
        km: { label: 'Kilometer (km)', factor: 1000 },
        in: { label: 'Inch (in)', factor: 0.0254 },
        ft: { label: 'Foot (ft)', factor: 0.3048 },
        yd: { label: 'Yard (yd)', factor: 0.9144 },
        mi: { label: 'Mile (mi)', factor: 1609.344 },
      },
    },
    {
      id: 'area',
      label: 'Area',
      base: 'm2',
      units: {
        mm2: { label: 'Square Millimeter (mm²)', factor: 1e-6 },
        cm2: { label: 'Square Centimeter (cm²)', factor: 1e-4 },
        m2: { label: 'Square Meter (m²)', factor: 1 },
        ha: { label: 'Hectare (ha)', factor: 10000 },
        km2: { label: 'Square Kilometer (km²)', factor: 1e6 },
        in2: { label: 'Square Inch (in²)', factor: 0.00064516 },
        ft2: { label: 'Square Foot (ft²)', factor: 0.09290304 },
        ac: { label: 'Acre (ac)', factor: 4046.8564224 },
      },
    },
    {
      id: 'mass',
      label: 'Mass',
      base: 'kg',
      units: {
        mg: { label: 'Milligram (mg)', factor: 1e-6 },
        g: { label: 'Gram (g)', factor: 0.001 },
        kg: { label: 'Kilogram (kg)', factor: 1 },
        oz: { label: 'Ounce (oz)', factor: 0.02834952 },
        lb: { label: 'Pound (lb)', factor: 0.45359237 },
        ton: { label: 'Metric Ton (t)', factor: 1000 },
      },
    },
    {
      id: 'data',
      label: 'Data',
      base: 'byte',
      units: {
        bit: { label: 'Bit (b)', factor: 0.125 },
        byte: { label: 'Byte (B)', factor: 1 },
        kb: { label: 'Kilobyte (KB)', factor: 1024 },
        mb: { label: 'Megabyte (MB)', factor: 1024 ** 2 },
        gb: { label: 'Gigabyte (GB)', factor: 1024 ** 3 },
        tb: { label: 'Terabyte (TB)', factor: 1024 ** 4 },
        pb: { label: 'Petabyte (PB)', factor: 1024 ** 5 },
      },
    },
    {
      id: 'temperature',
      label: 'Temperature',
      base: 'c',
      units: {
        c: { label: 'Celsius (°C)', factor: 1 },
        f: { label: 'Fahrenheit (°F)', factor: 1 },
        k: { label: 'Kelvin (K)', factor: 1 },
      },
    },
    {
      id: 'volume',
      label: 'Volume',
      base: 'l',
      units: {
        ml: { label: 'Milliliter (mL)', factor: 0.001 },
        l: { label: 'Liter (L)', factor: 1 },
        gal: { label: 'Gallon (US gal)', factor: 3.78541178 },
        qt: { label: 'Quart (US qt)', factor: 0.946352946 },
        pt: { label: 'Pint (US pt)', factor: 0.473176473 },
        cup: { label: 'Cup (US)', factor: 0.236588236 },
        floz: { label: 'Fluid Ounce (US fl oz)', factor: 0.02957353 },
      },
    },
    {
      id: 'time',
      label: 'Time',
      base: 's',
      units: {
        ms: { label: 'Millisecond (ms)', factor: 0.001 },
        s: { label: 'Second (s)', factor: 1 },
        min: { label: 'Minute (min)', factor: 60 },
        hr: { label: 'Hour (hr)', factor: 3600 },
        day: { label: 'Day', factor: 86400 },
        week: { label: 'Week', factor: 604800 },
        month: { label: 'Month (avg)', factor: 2628000 },
        year: { label: 'Year (avg)', factor: 31536000 },
      },
    },
    {
      id: 'speed',
      label: 'Speed',
      base: 'ms',
      units: {
        ms: { label: 'Meter per second (m/s)', factor: 1 },
        kph: { label: 'Kilometer per hour (km/h)', factor: 0.27777778 },
        mph: { label: 'Mile per hour (mph)', factor: 0.44704 },
        kn: { label: 'Knot (kn)', factor: 0.51444444 },
      },
    },
  ] as Category[], []);

  const [categoryIndex, setCategoryIndex] = useState(0);
  
  const currentCategory = categories[categoryIndex];
  const unitDefs = currentCategory.units;
  const initialKeys = Object.keys(currentCategory.units);

  const [fromUnit, setFromUnit] = useState(initialKeys[0] || '');
  const [toUnit, setToUnit] = useState(initialKeys[1] || initialKeys[0] || '');
  const [fromValue, setFromValue] = useState<string>('1');

  const changeCategory = (idx: number) => {
    setCategoryIndex(idx);
    const keys = Object.keys(categories[idx].units);
    setFromUnit(keys[0] || '');
    setToUnit(keys[1] || keys[0] || '');
    setFromValue('1');
  };

  const toValue = (() => {
    const val = parseFloat(fromValue);
    if (Number.isNaN(val)) return '';
    if (!fromUnit || !toUnit) return '';
    const result = convertValue(val, fromUnit, toUnit, currentCategory.id, currentCategory.units);
    return formatNumber(result);
  })();

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Unit Converter</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Convert between different units of measurement quickly</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-2xl mx-auto items-center">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => changeCategory(idx)}
                className={`px-3 py-1.5 border rounded-lg font-bold text-xs transition ${
                  categoryIndex === idx
                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="w-full flex flex-col gap-5 mt-2">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-50 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">From</label>
                <input
                  value={fromValue}
                  onChange={(e) => setFromValue(e.target.value)}
                  type="number"
                  placeholder="Enter value"
                  className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold"
                />
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold"
                >
                  {Object.entries(currentCategory.units).map(([key, def]) => (
                    <option key={key} value={key}>
                      {def.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={swapUnits}
                className="w-10 h-10 flex items-center justify-center border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition self-center lg:self-end"
              >
                <ArrowRightLeft className="w-4.5 h-4.5" />
              </button>

              <div className="flex-1 min-w-50 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">To</label>
                <input
                  value={toValue}
                  type="text"
                  readOnly
                  placeholder="Result"
                  className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 outline-none text-sm font-semibold"
                />
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white outline-none focus:border-amber-500 text-sm font-semibold"
                >
                  {Object.entries(currentCategory.units).map(([key, def]) => (
                    <option key={key} value={key}>
                      {def.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-baseline justify-center gap-1.5 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl">
              <span className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tight leading-none tabular-nums">
                {toValue || '—'}
              </span>
              <span className="text-sm font-bold text-slate-500">
                {unitDefs[toUnit]?.label.split('(')[1]?.replace(')', '') || toUnit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
