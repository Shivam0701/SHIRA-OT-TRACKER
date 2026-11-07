import React, { useState } from 'react';
import {
  Calculator as CalculatorIcon,
  IndianRupee,
  Clock,
  CalendarDays,
  Briefcase,
  RotateCcw,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import Character from '../components/Character.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}
function formatNum(n, decimals = 2) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const YEAR_OPTIONS = [];
for (let y = 9999; y >= 1900; y--) YEAR_OPTIONS.push(y);

const now  = new Date();
const INIT = { month: now.getMonth() + 1, year: now.getFullYear(), salary: '', dailyHours: '', otHours: '' };

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon, error, children }) {
  return (
    <div className="ci-field">
      <div className="ci-label">
        <span className="ci-label-icon">{icon}</span>
        {label}
      </div>
      <div className={`ci-control${error ? ' ci-control--error' : ''}`}>
        {children}
      </div>
      {error && (
        <div className="ci-error">
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Character state logic ─────────────────────────────────────────────────────
function getCharState(form, result, calculating) {
  if (result)                                                  return { state: 'result',      label: 'Nailed it!' };
  if (calculating)                                             return { state: 'calculating', label: 'Crunching numbers...' };
  if (form.otHours !== '' && parseFloat(form.otHours) >= 0)   return { state: 'calculating', label: 'OT hours entered!' };
  if (form.dailyHours !== '' && parseFloat(form.dailyHours) > 0) return { state: 'clock',    label: 'Checking the clock...' };
  if (form.salary !== '' && parseFloat(form.salary) > 0)      return { state: 'money',       label: 'Counting cash!' };
  if (form.month && form.year)                                 return { state: 'calendar',    label: 'Checking calendar...' };
  return                                                              { state: 'idle',        label: 'Ready to calculate!' };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SalaryCalculator() {
  const [form, setForm]        = useState(INIT);
  const [errors, setErrors]    = useState({});
  const [result, setResult]    = useState(null);
  const [calculating, setCalc] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setResult(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.month || !form.year) errs.monthYear = 'Please select a month and year.';
    const salary = parseFloat(form.salary);
    if (!form.salary || isNaN(salary) || salary <= 0)
      errs.salary = 'Enter a valid salary greater than zero.';
    const dailyHours = parseFloat(form.dailyHours);
    if (!form.dailyHours || isNaN(dailyHours) || dailyHours <= 0)
      errs.dailyHours = 'Enter valid working hours greater than zero.';
    else if (dailyHours > 24)
      errs.dailyHours = 'Cannot exceed 24 hours.';
    const otHours = parseFloat(form.otHours);
    if (form.otHours === '' || isNaN(otHours) || otHours < 0)
      errs.otHours = 'OT hours cannot be negative.';
    return errs;
  };

  const handleCalculate = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); setResult(null); return; }
    setCalc(true);
    setTimeout(() => {
      const year         = parseInt(form.year, 10);
      const month        = parseInt(form.month, 10);
      const totalDays    = daysInMonth(year, month);
      const salary       = parseFloat(form.salary);
      const dailyHours   = parseFloat(form.dailyHours);
      const otHours      = parseFloat(form.otHours);
      const dailySalary  = salary / totalDays;
      const hourlySalary = dailySalary / dailyHours;
      const otEarnings   = hourlySalary * otHours;
      const finalSalary  = salary + otEarnings;
      setResult({
        monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
        totalDays, salary, dailySalary, hourlySalary, otHours, otEarnings, finalSalary,
      });
      setCalc(false);
    }, 600);
  };

  const handleClear = () => { setForm(INIT); setErrors({}); setResult(null); setCalc(false); };

  const { state: charState, label: charLabel } = getCharState(form, result, calculating);

  return (
    <div className="page-split">

      {/* ── Left: form ── */}
      <div className="page-split-form">

        {/* Input card */}
        <div className="ci-card">
          <div className="ci-header">
            <div className="ci-header-icon">
              <CalculatorIcon size={18} />
            </div>
            <div>
              <div className="ci-header-title">OT Salary Calculator</div>
              <div className="ci-header-sub">Instant overtime earnings estimate</div>
            </div>
          </div>

          <div className="ci-divider" />

          <div className="ci-fields">

            {/* Month + Year */}
            <Field label="Month & Year" icon={<CalendarDays size={13} />} error={errors.monthYear}>
              <div className="ci-row">
                <select className="ci-select" value={form.month} onChange={e => set('month', parseInt(e.target.value, 10))}>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
                <select className="ci-select" value={form.year} onChange={e => set('year', parseInt(e.target.value, 10))}>
                  {YEAR_OPTIONS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </Field>

            {/* Monthly Salary */}
            <Field label="Monthly Salary" icon={<IndianRupee size={13} />} error={errors.salary}>
              <div className="ci-prefix-wrap">
                <span className="ci-prefix">₹</span>
                <input
                  className="ci-input ci-input--prefixed"
                  type="number" min="1" step="0.01" placeholder="50,000"
                  value={form.salary}
                  onChange={e => set('salary', e.target.value)}
                />
              </div>
            </Field>

            {/* Daily Hours + OT Hours */}
            <div className="ci-row">
              <Field label="Daily Working Hours" icon={<Briefcase size={13} />} error={errors.dailyHours}>
                <div className="ci-suffix-wrap">
                  <input
                    className="ci-input ci-input--suffixed"
                    type="number" min="0.5" max="24" step="0.5" placeholder="8"
                    value={form.dailyHours}
                    onChange={e => set('dailyHours', e.target.value)}
                  />
                  <span className="ci-suffix">hrs</span>
                </div>
              </Field>
              <Field label="Total OT Hours" icon={<Clock size={13} />} error={errors.otHours}>
                <div className="ci-suffix-wrap">
                  <input
                    className="ci-input ci-input--suffixed"
                    type="number" min="0" step="0.5" placeholder="12.5"
                    value={form.otHours}
                    onChange={e => set('otHours', e.target.value)}
                  />
                  <span className="ci-suffix">hrs</span>
                </div>
              </Field>
            </div>

          </div>

          {/* Buttons */}
          <div className="ci-actions">
            <button className="ci-btn-calculate" onClick={handleCalculate}>
              <Sparkles size={15} />
              Calculate OT Salary
            </button>
            <button className="ci-btn-clear" onClick={handleClear} title="Clear all">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Results card */}
        {result && (
          <div className="ci-results" style={{ animation: 'slideUp 0.22s ease', marginTop: '16px' }}>
            <div className="ci-result-rows">
              {[
                { label: 'Month',          value: result.monthLabel },
                { label: 'Days in Month',  value: `${result.totalDays} days` },
                { label: 'Monthly Salary', value: formatINR(result.salary) },
                { label: 'Daily Salary',   value: formatINR(result.dailySalary) },
                { label: 'Hourly Rate',    value: formatINR(result.hourlySalary) },
                { label: 'OT Hours',       value: `${formatNum(result.otHours)} hrs` },
              ].map(({ label, value }) => (
                <div className="ci-result-row" key={label}>
                  <span className="ci-result-label">{label}</span>
                  <span className="ci-result-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="ci-earnings">
              <div className="ci-earnings-inner">
                <div className="ci-earnings-icon"><TrendingUp size={16} /></div>
                <div>
                  <div className="ci-earnings-label">Total OT Earnings</div>
                  <div className="ci-earnings-value">{formatINR(result.otEarnings)}</div>
                </div>
              </div>
            </div>

            <div className="ci-final">
              <div className="ci-final-label">Final Salary</div>
              <div className="ci-final-sub">{result.monthLabel}</div>
              <div className="ci-final-value">{formatINR(result.finalSalary)}</div>
              <div className="ci-final-eq">
                {formatINR(result.salary)} + {formatINR(result.otEarnings)}
              </div>
            </div>
          </div>
        )}

      </div> {/* end page-split-form */}

      {/* ── Right: character ── */}
      <div className="page-split-char">
        <Character state={charState} label={charLabel} />
      </div>

    </div>
  );
}
