import { useState, useEffect } from 'react';
import { usePincodeStore, getStatesFromJson, getCitiesFromJson } from '@/store/pincodeStore';
import { X, ChevronRight, ChevronLeft, Check, AlertTriangle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/LabelSimple';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/DialogSimple';
import { toast } from 'sonner';
import { BULK_EDITABLE_FIELDS, FIELD_GROUPS } from '../config/bulkFieldConfig';
import type {
  PincodeField,
  PincodeBulkFilter,
  PincodeBulkUpdate,
  BulkUpdateStep,
} from '../types/pincodeBulkTypes';

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: BulkUpdateStep[] = [
  { id: 1, title: 'Choose Field',  description: 'Select the field you want to update' },
  { id: 2, title: 'Set Filters',   description: 'Define which pincodes to update (leave blank for ALL)' },
  { id: 3, title: 'Set Value',     description: 'Enter the new value for the selected field' },
  { id: 4, title: 'Preview',       description: 'Review and confirm the bulk update' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkUpdateModal = ({ isOpen, onClose, onSuccess }: BulkUpdateModalProps) => {
  const { genericBulkUpdate, fetchPincodes } = usePincodeStore();

  const [currentStep, setCurrentStep]     = useState(1);
  const [selectedField, setSelectedField] = useState<PincodeField>('is_serviceable');
  const [fieldValue, setFieldValue]       = useState<boolean | string | number>(true);

  const [previewResult, setPreviewResult] = useState<{
    affectedCount: number;
    samplePincodes: string[];
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);

  // ── Geographic filter state ───────────────────────────────────────────────
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [stateSearch, setStateSearch]         = useState('');
  const [citySearch, setCitySearch]           = useState('');
  const [selectedStates, setSelectedStates]   = useState<string[]>([]);
  const [selectedCities, setSelectedCities]   = useState<string[]>([]);
  const [selectedPincodes, setSelectedPincodes]   = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState('');

  // ── Boolean filter state ──────────────────────────────────────────────────
  const [filterActive,           setFilterActive]           = useState<boolean | undefined>(undefined);
  const [filterServiceable,      setFilterServiceable]      = useState<boolean | undefined>(undefined);
  const [filterCodAllowed,       setFilterCodAllowed]       = useState<boolean | undefined>(undefined);
  const [filterCodFeesApplicable,setFilterCodFeesApplicable]= useState<boolean | undefined>(undefined);
  const [filterReturnable,       setFilterReturnable]       = useState<boolean | undefined>(undefined);
  const [filterExchangeable,     setFilterExchangeable]     = useState<boolean | undefined>(undefined);

  // ── Numeric filter state ──────────────────────────────────────────────────
  const [shippingFeeCondition,    setShippingFeeCondition]    = useState<'gt' | 'lt' | 'eq' | ''>('');
  const [shippingFeeValue,        setShippingFeeValue]        = useState(0);
  const [codFeeCondition,         setCodFeeCondition]         = useState<'gt' | 'lt' | 'eq' | ''>('');
  const [codFeeValue,             setCodFeeValue]             = useState(0);
  const [freeShippingCondition,   setFreeShippingCondition]   = useState<'gt' | 'lt' | 'eq' | ''>('');
  const [freeShippingValue,       setFreeShippingValue]       = useState(0);
  const [minOrderCondition,       setMinOrderCondition]       = useState<'gt' | 'lt' | 'eq' | ''>('');
  const [minOrderValue,           setMinOrderValue]           = useState(0);
  const [returnWindowCondition,   setReturnWindowCondition]   = useState<'gt' | 'lt' | 'eq' | ''>('');
  const [returnWindowValue,       setReturnWindowValue]       = useState(0);
  const [exchangeWindowCondition, setExchangeWindowCondition] = useState<'gt' | 'lt' | 'eq' | ''>('');
  const [exchangeWindowValue,     setExchangeWindowValue]     = useState(0);

  // ── Load states/cities from JSON when modal opens ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    // Load all states from JSON (no Supabase)
    getStatesFromJson().then(setAvailableStates).catch(() => toast.error('Failed to load states'));
    // Load all cities initially (will be filtered when states are selected)
    getCitiesFromJson().then(setAvailableCities).catch(() => toast.error('Failed to load cities'));
  }, [isOpen]);

  // When selected states change, re-filter cities from JSON (no Supabase)
  useEffect(() => {
    if (selectedStates.length > 0) {
      // Get cities for ALL selected states and merge
      Promise.all(selectedStates.map((s) => getCitiesFromJson(s)))
        .then((arrays) => {
          const merged = Array.from(new Set(arrays.flat())).sort((a, b) => a.localeCompare(b));
          setAvailableCities(merged);
        })
        .catch(() => toast.error('Failed to load cities'));
    } else {
      getCitiesFromJson().then(setAvailableCities).catch(() => {});
    }
    // Clear city selection when state selection changes
    setSelectedCities([]);
  }, [selectedStates]);

  // Reset field value when selected field changes
  useEffect(() => {
    const cfg = BULK_EDITABLE_FIELDS[selectedField];
    if (cfg.type === 'boolean')    setFieldValue(true);
    else if (cfg.type === 'text')  setFieldValue('');
    else                           setFieldValue(0);
  }, [selectedField]);

  // ── Filter builder ────────────────────────────────────────────────────────
  const buildFilters = (): PincodeBulkFilter => {
    const f: PincodeBulkFilter = {};
    if (selectedStates.length > 0) f.states = selectedStates;
    if (selectedCities.length > 0) f.cities = selectedCities;
    if (selectedPincodes.trim()) {
      f.pincodes = selectedPincodes.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
    }
    if (selectedDistricts.trim()) {
      f.districts = selectedDistricts.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
    }
    if (filterActive           !== undefined) f.active              = filterActive;
    if (filterServiceable      !== undefined) f.is_serviceable      = filterServiceable;
    if (filterCodAllowed       !== undefined) f.cod_allowed         = filterCodAllowed;
    if (filterCodFeesApplicable!== undefined) f.cod_fees_applicable = filterCodFeesApplicable;
    if (filterReturnable       !== undefined) f.is_returnable       = filterReturnable;
    if (filterExchangeable     !== undefined) f.is_exchangeable     = filterExchangeable;
    if (shippingFeeCondition)   (f as Record<string, unknown>)[`shipping_fee_${shippingFeeCondition}`]             = shippingFeeValue;
    if (codFeeCondition)        (f as Record<string, unknown>)[`cod_fee_${codFeeCondition}`]                       = codFeeValue;
    if (freeShippingCondition)  (f as Record<string, unknown>)[`free_shipping_threshold_${freeShippingCondition}`] = freeShippingValue;
    if (minOrderCondition)      (f as Record<string, unknown>)[`min_order_amount_${minOrderCondition}`]            = minOrderValue;
    if (returnWindowCondition)  (f as Record<string, unknown>)[`return_window_days_${returnWindowCondition}`]      = returnWindowValue;
    if (exchangeWindowCondition)(f as Record<string, unknown>)[`exchange_window_days_${exchangeWindowCondition}`] = exchangeWindowValue;
    
    console.log('=== BUILDFILTERS DEBUG ===');
    console.log('Selected states:', selectedStates);
    console.log('Selected cities:', selectedCities);
    console.log('Selected pincodes:', selectedPincodes);
    console.log('Selected districts:', selectedDistricts);
    console.log('Filter active:', filterActive, 'type:', typeof filterActive);
    console.log('Filter serviceable:', filterServiceable, 'type:', typeof filterServiceable);
    console.log('Filter cod allowed:', filterCodAllowed, 'type:', typeof filterCodAllowed);
    console.log('Filter cod fees applicable:', filterCodFeesApplicable, 'type:', typeof filterCodFeesApplicable);
    console.log('Filter returnable:', filterReturnable, 'type:', typeof filterReturnable);
    console.log('Filter exchangeable:', filterExchangeable, 'type:', typeof filterExchangeable);
    console.log('Built filters:', JSON.stringify(f, null, 2));
    
    return f;
  };

  const isNoFilterSet = () => {
    const f = buildFilters();
    return Object.keys(f).length === 0;
  };

  // ── Step navigation guards ────────────────────────────────────────────────
  const canProceedToStep2 = () => !!selectedField;

  /**
   * Step 2 → Step 3: ALWAYS allowed.
   * If no filter is set, the update will apply to ALL pincodes — the user is
   * warned clearly in the preview step before confirming.
   */
  const canProceedToStep3 = () => true;

  const canProceedToStep4 = () => {
    const cfg = BULK_EDITABLE_FIELDS[selectedField];
    if (cfg.validation) return !cfg.validation(fieldValue);
    return true;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePreview = async () => {
    setLoadingPreview(true);
    setPreviewResult(null);
    try {
      const currentFilters = buildFilters();
      const result = await genericBulkUpdate(currentFilters as Record<string, unknown>, {}, true);
      if (result.error && result.affectedCount === 0) {
        toast.error(result.error);
        return;
      }
      setPreviewResult({ affectedCount: result.affectedCount, samplePincodes: result.samplePincodes ?? [] });
      setCurrentStep(4);
    } catch {
      toast.error('Failed to preview bulk update');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    if (!previewResult || previewResult.affectedCount === 0) return;
    setLoadingExecute(true);
    try {
      const currentFilters = buildFilters();
      const updates: PincodeBulkUpdate = {};
      (updates as Record<string, unknown>)[selectedField] = fieldValue;

      const result = await genericBulkUpdate(currentFilters as Record<string, unknown>, updates as Record<string, unknown>, false);
      if (result.error) { toast.error(result.error); return; }

      toast.success(`Successfully updated ${result.affectedCount} pincodes`);
      await fetchPincodes(1, '');
      onSuccess?.();
      onClose();
      resetForm();
    } catch {
      toast.error('Failed to execute bulk update');
    } finally {
      setLoadingExecute(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedField('is_serviceable');
    setFieldValue(true);
    setPreviewResult(null);
    setStateSearch('');
    setCitySearch('');
    setSelectedStates([]);
    setSelectedCities([]);
    setSelectedPincodes('');
    setSelectedDistricts('');
    setFilterActive(undefined);
    setFilterServiceable(undefined);
    setFilterCodAllowed(undefined);
    setFilterCodFeesApplicable(undefined);
    setFilterReturnable(undefined);
    setFilterExchangeable(undefined);
    setShippingFeeCondition(''); setShippingFeeValue(0);
    setCodFeeCondition('');      setCodFeeValue(0);
    setFreeShippingCondition('');setFreeShippingValue(0);
    setMinOrderCondition('');    setMinOrderValue(0);
    setReturnWindowCondition('');setReturnWindowValue(0);
    setExchangeWindowCondition('');setExchangeWindowValue(0);
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Step renderers ────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      {Object.entries(FIELD_GROUPS).map(([group, fields]) => (
        <div key={group}>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {group.replace(/_/g, ' ')}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {(fields as readonly PincodeField[]).map((field) => (
              <label key={field} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input type="radio" name="field" value={field} checked={selectedField === field} onChange={() => setSelectedField(field)} className="mr-3" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{BULK_EDITABLE_FIELDS[field].label}</div>
                  {BULK_EDITABLE_FIELDS[field].description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{BULK_EDITABLE_FIELDS[field].description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const filteredStates = availableStates.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()));
  const filteredCities = availableCities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()));

  const renderStep2 = () => (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">

      {/* "Update All" hint */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-800 dark:text-blue-200">
        <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>Leave all filters blank to update <strong>all pincodes</strong> in the database.</span>
      </div>

      {/* ── Geographic Filters ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Geographic Filters</h4>

        {/* States */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            States ({selectedStates.length} selected)
            {selectedStates.length > 0 && (
              <button onClick={() => setSelectedStates([])} className="ml-2 text-xs text-red-500 hover:text-red-700 underline">clear</button>
            )}
          </Label>
          <input
            type="search"
            placeholder="Search states…"
            value={stateSearch}
            onChange={(e) => setStateSearch(e.target.value)}
            className="w-full border rounded p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 mb-1"
          />
          <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
            {filteredStates.length === 0 ? (
              <p className="text-xs text-gray-500 p-2">No states found</p>
            ) : filteredStates.map((state) => (
              <label key={state} className="flex items-center space-x-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 px-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedStates.includes(state)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedStates([...selectedStates, state]);
                    else setSelectedStates(selectedStates.filter((s) => s !== state));
                  }}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm">{state}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Cities ({selectedCities.length} selected)
            {selectedStates.length > 0 && <span className="ml-1 text-xs text-gray-500">(filtered by selected states)</span>}
            {selectedCities.length > 0 && (
              <button onClick={() => setSelectedCities([])} className="ml-2 text-xs text-red-500 hover:text-red-700 underline">clear</button>
            )}
          </Label>
          <input
            type="search"
            placeholder="Search cities…"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full border rounded p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 mb-1"
          />
          <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700/50">
            {filteredCities.length === 0 ? (
              <p className="text-xs text-gray-500 p-2">{selectedStates.length > 0 ? 'No cities for selected states' : 'No cities found'}</p>
            ) : filteredCities.map((city) => (
              <label key={city} className="flex items-center space-x-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 px-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedCities.includes(city)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCities([...selectedCities, city]);
                    else setSelectedCities(selectedCities.filter((c) => c !== city));
                  }}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm">{city}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Specific pincodes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Specific Pincodes (comma or space separated)</Label>
          <textarea
            value={selectedPincodes}
            onChange={(e) => setSelectedPincodes(e.target.value)}
            placeholder="e.g. 560001, 560002, 110001"
            className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 min-h-[60px] resize-y text-sm"
          />
        </div>

        {/* Districts */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Districts (comma or space separated)</Label>
          <textarea
            value={selectedDistricts}
            onChange={(e) => setSelectedDistricts(e.target.value)}
            placeholder="e.g. Bangalore, Mysore"
            className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 min-h-[60px] resize-y text-sm"
          />
        </div>
      </div>

      {/* ── Boolean Filters ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Status Filters</h4>
        <div className="grid grid-cols-2 gap-3">
          {([
            { label: 'Active',                val: filterActive,            set: setFilterActive },
            { label: 'Serviceable',           val: filterServiceable,       set: setFilterServiceable },
            { label: 'COD Allowed',           val: filterCodAllowed,        set: setFilterCodAllowed },
            { label: 'COD Fees Applicable',   val: filterCodFeesApplicable, set: setFilterCodFeesApplicable },
            { label: 'Returnable',            val: filterReturnable,        set: setFilterReturnable },
            { label: 'Exchangeable',          val: filterExchangeable,      set: setFilterExchangeable },
          ] as const).map(({ label, val, set }) => (
            <div key={label} className="flex items-center justify-between rounded-lg border dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-sm">{label}</span>
              <select
                value={val === undefined ? '' : String(val)}
                onChange={(e) => (set as (v: boolean | undefined) => void)(e.target.value === '' ? undefined : e.target.value === 'true')}
                className="border rounded p-1 text-xs bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Numeric Filters ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Numeric Filters</h4>
        <div className="grid grid-cols-1 gap-3">
          {([
            { label: 'Shipping Fee (₹)',           cond: shippingFeeCondition,    setCond: setShippingFeeCondition,    val: shippingFeeValue,    setVal: setShippingFeeValue,    step: '0.01' },
            { label: 'COD Fee (₹)',                cond: codFeeCondition,         setCond: setCodFeeCondition,         val: codFeeValue,         setVal: setCodFeeValue,         step: '0.01' },
            { label: 'Free Shipping Threshold (₹)',cond: freeShippingCondition,   setCond: setFreeShippingCondition,   val: freeShippingValue,   setVal: setFreeShippingValue,   step: '0.01' },
            { label: 'Min Order Amount (₹)',       cond: minOrderCondition,       setCond: setMinOrderCondition,       val: minOrderValue,       setVal: setMinOrderValue,       step: '0.01' },
            { label: 'Return Window (days)',       cond: returnWindowCondition,   setCond: setReturnWindowCondition,   val: returnWindowValue,   setVal: setReturnWindowValue,   step: '1' },
            { label: 'Exchange Window (days)',     cond: exchangeWindowCondition, setCond: setExchangeWindowCondition, val: exchangeWindowValue, setVal: setExchangeWindowValue, step: '1' },
          ] as const).map(({ label, cond, setCond, val, setVal, step }) => (
            <div key={label} className="flex items-center gap-2">
              <select
                value={cond}
                onChange={(e) => (setCond as (v: 'gt' | 'lt' | 'eq' | '') => void)(e.target.value as 'gt' | 'lt' | 'eq' | '')}
                className="border rounded p-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 min-w-[170px]"
              >
                <option value="">{label}</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
                <option value="eq">Equal to</option>
              </select>
              {cond && (
                <Input
                  type="number"
                  min={0}
                  step={step}
                  value={val}
                  onChange={(e) => (setVal as (v: number) => void)(Number(e.target.value))}
                  className="flex-1 text-sm"
                  placeholder="Value"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const cfg = BULK_EDITABLE_FIELDS[selectedField];
    const validationError = cfg.validation ? cfg.validation(fieldValue) : null;
    return (
      <div className="space-y-4">
        {isNoFilterSet() && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg text-sm text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span><strong>No filters set.</strong> This will update <strong>ALL pincodes</strong> in the database.</span>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-sm font-medium">New Value for <strong>{cfg.label}</strong></Label>
          {cfg.type === 'boolean' ? (
            <div className="flex items-center space-x-6">
              {[{ label: 'True / Yes', value: true }, { label: 'False / No', value: false }].map(({ label, value }) => (
                <label key={label} className="flex items-center cursor-pointer">
                  <input type="radio" name="fieldValue" value={String(value)} checked={fieldValue === value} onChange={() => setFieldValue(value)} className="mr-2" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          ) : cfg.type === 'text' ? (
            <Input value={fieldValue as string} onChange={(e) => setFieldValue(e.target.value)} placeholder={cfg.placeholder} className="w-full text-sm" />
          ) : (
            <Input type="number" min={cfg.min} step={cfg.step} value={fieldValue as number} onChange={(e) => setFieldValue(Number(e.target.value))} placeholder={cfg.placeholder} className="w-full text-sm" />
          )}
          {validationError && <p className="text-xs text-red-500">{validationError}</p>}
          {cfg.description && <p className="text-xs text-gray-500 dark:text-gray-400">{cfg.description}</p>}
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const f = buildFilters();
    const filterSummary: string[] = [];
    if ((f.states?.length ?? 0) > 0)  filterSummary.push(`States: ${f.states!.join(', ')}`);
    if ((f.cities?.length ?? 0) > 0)  filterSummary.push(`Cities: ${f.cities!.join(', ')}`);
    if ((f.pincodes?.length ?? 0) > 0) filterSummary.push(`Pincodes: ${f.pincodes!.join(', ')}`);
    if (filterSummary.length === 0)   filterSummary.push('All pincodes (no filters)');

    return (
      <div className="space-y-4">
        {/* Update Summary */}
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-semibold mb-3 text-sm">Update Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="font-medium">Field:</span><span>{BULK_EDITABLE_FIELDS[selectedField].label}</span></div>
            <div className="flex justify-between"><span className="font-medium">New Value:</span><span className="font-mono">{String(fieldValue)}</span></div>
            <div className="flex justify-between"><span className="font-medium">Affected Pincodes:</span><span className="font-mono font-bold">{previewResult?.affectedCount ?? 0}</span></div>
            <div className="flex flex-col gap-1">
              <span className="font-medium">Filters Applied:</span>
              {filterSummary.map((s, i) => <span key={i} className="text-xs text-gray-600 dark:text-gray-400 pl-2">• {s}</span>)}
            </div>
          </div>
        </div>

        {/* Sample pincodes */}
        {previewResult && previewResult.affectedCount > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sample Pincodes (up to 50)</Label>
            <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50 max-h-40 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {previewResult.samplePincodes.map((p) => (
                  <span key={p} className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2.5 py-1 rounded font-mono">{p}</span>
                ))}
                {previewResult.affectedCount > previewResult.samplePincodes.length && (
                  <span className="inline-block bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded">
                    +{previewResult.affectedCount - previewResult.samplePincodes.length} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Large update warning */}
        {previewResult && previewResult.affectedCount > 500 && (
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Large Update Warning:</strong> You are about to update {previewResult.affectedCount} pincodes. Please review carefully before confirming.
            </p>
          </div>
        )}

        {/* Zero match warning */}
        {previewResult && previewResult.affectedCount === 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              No pincodes matched the selected filters. Go back and adjust the filters.
            </p>
          </div>
        )}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-auto">
        <DialogClose onClick={handleClose} />
        <DialogHeader>
          <DialogTitle className="text-xl">Bulk Update Pincodes</DialogTitle>
          <DialogDescription className="text-sm">{STEPS[currentStep - 1].description}</DialogDescription>
        </DialogHeader>

        {/* ── Step Indicator ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className="text-xs mt-2 text-center font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded transition-colors ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step Content ───────────────────────────────────────────────── */}
        <div className="min-h-[300px] bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <div className="flex justify-between mt-6 pt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} disabled={currentStep === 1} className="text-sm">
            <ChevronLeft className="h-4 w-4 mr-2" />Back
          </Button>

          <div className="flex gap-3">
            {currentStep < 3 && (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={currentStep === 1 ? !canProceedToStep2() : !canProceedToStep3()}
                className="text-sm"
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button onClick={handlePreview} disabled={!canProceedToStep4() || loadingPreview} className="text-sm">
                {loadingPreview ? 'Previewing…' : 'Preview'} <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === 4 && (
              <Button
                onClick={handleExecute}
                disabled={loadingExecute || !previewResult || previewResult.affectedCount === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {loadingExecute ? 'Updating…' : `Confirm – Update ${previewResult?.affectedCount ?? 0} Pincodes`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};