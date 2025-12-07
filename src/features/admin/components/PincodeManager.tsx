import { useState, useEffect } from 'react';
import { usePincodeStore, type PincodeDetails, type BulkPincodeUpdateRequest } from '@/store/pincodeStore';
import { Search, Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Edit3, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/SwitchSimple';
import { Label } from '@/components/ui/LabelSimple';
import { PincodeModal, type PincodeFormValues } from './PincodeModal';
import { toast } from 'sonner';
import { supabase } from '@lib/supabase';

// Canonical list of Indian states/UTs (uppercased) used as fallback to ensure visibility in dropdown
const ALL_INDIAN_STATES = [
  'KARNATAKA',
  'DELHI',
  'LADAKH',
  'RAJASTHAN',
  'MANIPUR',
  'WEST BENGAL',
  'ANDHRA PRADESH',
  'MADHYA PRADESH',
  'KERALA',
  'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'TELANGANA',
  'GUJARAT',
  'BIHAR',
  'GOA',
  'CHANDIGARH',
  'TRIPURA',
  'NAGALAND',
  'JHARKHAND',
  'ASSAM',
  'PUNJAB',
  'JAMMU AND KASHMIR',
  'ANDAMAN AND NICOBAR ISLANDS',
  'PUDUCHERRY',
  'ODISHA',
  'MEGHALAYA',
  'MIZORAM',
  'MAHARASHTRA',
  'ARUNACHAL PRADESH',
  'CHHATTISGARH',
  'TAMIL NADU',
  'SIKKIM',
  'LAKSHADWEEP',
  'HARYANA',
  'UTTARAKHAND',
  'UTTAR PRADESH',
  'HIMACHAL PRADESH',
];

export const PincodeManager = () => {
  const {
    pincodes,
    loading,
    error,
    currentPage,
    totalCount,
    itemsPerPage,
    fetchPincodes,
    createPincode,
    updatePincode,
    deletePincode,
    bulkUpdatePincodes,
    getBulkUpdateCount,
    setSearchQuery,
    setCurrentPage,
  } = usePincodeStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPincode, setEditingPincode] = useState<string | null>(null);
  
  // New bulk update state
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [selectedField, setSelectedField] = useState<BulkPincodeUpdateRequest['field']>('is_serviceable');
  const [selectedScope, setSelectedScope] = useState<BulkPincodeUpdateRequest['scope']>('all');
  const [fieldValue, setFieldValue] = useState<boolean | string | number>(true);
  const [scopeValue, setScopeValue] = useState('');
  const [multiplePincodes, setMultiplePincodes] = useState('');
  
  // Separate state for new bulk update preview
  const [bulkPreviewCount, setBulkPreviewCount] = useState<number | null>(null);
  const [bulkPreviewSample, setBulkPreviewSample] = useState<string[]>([]);
  const [loadingBulkPreview, setLoadingBulkPreview] = useState(false);
  
  // Legacy bulk edit state (keeping for compatibility)
  const [selectedPincodes, setSelectedPincodes] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none');
  const [bulkEditData, setBulkEditData] = useState({
    is_serviceable: false,
    cod_allowed: false,
    min_order_amount: '',
    shipping_fee: '',
    cod_fee: '',
    free_shipping_threshold: '',
  });
  const [bulkSelectionMode, setBulkSelectionMode] = useState<'selected' | 'state' | 'city' | 'search'>('selected');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchPincodes, setSearchPincodes] = useState('');
  const [previewPincodes, setPreviewPincodes] = useState<string[]>([]);

  // Function declarations
  const fetchStatesAndCities = async () => {
    try {
      // Fetch DISTINCT states and cities with generous limits to avoid default server caps
      // Get distinct states
      const { data: statesData, error: statesErr } = await supabase
        .from('pincodes')
        .select('state', { count: 'exact' })
        .not('state', 'is', null)
        .order('state', { ascending: true })
        .limit(100000);

      if (statesErr) throw statesErr;

      // Get distinct cities
      const { data: citiesData, error: citiesErr } = await supabase
        .from('pincodes')
        .select('city', { count: 'exact' })
        .not('city', 'is', null)
        .order('city', { ascending: true })
        .limit(100000);

      if (citiesErr) throw citiesErr;

      // Normalize states to uppercase, trim, and merge with canonical list to ensure visibility
      const dbStates = (statesData || [] as Array<{ state: string }>)
        .map(p => String(p.state).trim().toUpperCase())
        .filter(Boolean);
      const mergedStates = Array.from(new Set([...dbStates, ...ALL_INDIAN_STATES])).sort();

      // Cities: keep original casing but trim and de-dup
      const uniqueCities = Array.from(
        new Set((citiesData || [] as Array<{ city: string }>)
          .map(p => String(p.city).trim())
          .filter(Boolean))
      ).sort((a: string, b: string) => a.localeCompare(b));

      setAvailableStates(mergedStates);
      setAvailableCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching states and cities:', error);
      toast.error('Failed to load states and cities');
    }
  };

  const fetchCitiesByState = async (state: string) => {
    try {
      // Get distinct cities for the selected state
      const { data, error } = await supabase
        .from('pincodes')
        .select('city', { count: 'exact' })
        .ilike('state', state)
        .not('city', 'is', null)
        .order('city', { ascending: true })
        .limit(100000);

      if (error) throw error;

      const uniqueCities = Array.from(
        new Set((data || [] as Array<{ city: string }>)
          .map(p => String(p.city).trim())
          .filter(Boolean))
      ).sort((a: string, b: string) => a.localeCompare(b));
      setAvailableCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast.error('Failed to load cities');
    }
  };

  // Preview for new bulk update modal
  const previewBulkUpdate = async () => {
    setLoadingBulkPreview(true);
    try {
      let count = 0;
      let sample: string[] = [];
      
      // Build request based on scope
      const request: any = { scope: selectedScope };
      
      if (selectedScope === 'state' && scopeValue) {
        request.state = scopeValue;
        count = await getBulkUpdateCount(request);
        
        // Get sample pincodes for display
        const { data } = await supabase
          .from('pincodes')
          .select('pincode')
          .eq('state', scopeValue)
          .limit(50);
        sample = data?.map(p => p.pincode) || [];
        
      } else if (selectedScope === 'city' && scopeValue) {
        request.city = scopeValue;
        count = await getBulkUpdateCount(request);
        
        // Get sample pincodes for display
        const { data } = await supabase
          .from('pincodes')
          .select('pincode')
          .eq('city', scopeValue)
          .limit(50);
        sample = data?.map(p => p.pincode) || [];
        
      } else if (selectedScope === 'single_pincode' && scopeValue) {
        request.pincode = scopeValue.trim();
        count = await getBulkUpdateCount(request);
        sample = count > 0 ? [scopeValue.trim()] : [];
        
      } else if (selectedScope === 'multiple_pincodes' && multiplePincodes) {
        const pincodeList = multiplePincodes.split(/[\s,]+/).map(p => p.trim()).filter(p => p);
        if (pincodeList.length > 0) {
          request.pincodes = pincodeList;
          count = await getBulkUpdateCount(request);
          sample = pincodeList.slice(0, 50);
        }
        
      } else if (selectedScope === 'all') {
        count = await getBulkUpdateCount({ scope: 'all' });
        
        // Get sample pincodes for display
        const { data } = await supabase
          .from('pincodes')
          .select('pincode')
          .limit(50);
        sample = data?.map(p => p.pincode) || [];
      }
      
      setBulkPreviewCount(count);
      setBulkPreviewSample(sample);
      
    } catch (error) {
      console.error('Error previewing bulk update:', error);
      setBulkPreviewCount(0);
      setBulkPreviewSample([]);
    } finally {
      setLoadingBulkPreview(false);
    }
  };

  // Preview for legacy bulk edit modal
  const previewLegacyBulkEdit = async () => {
    try {
      if (bulkSelectionMode === 'state' && selectedState) {
        const { data } = await supabase
          .from('pincodes')
          .select('pincode')
          .eq('state', selectedState)
          .limit(20000);
        setPreviewPincodes(data?.map(p => p.pincode) || []);
      } else if (bulkSelectionMode === 'city' && selectedCity) {
        const { data } = await supabase
          .from('pincodes')
          .select('pincode')
          .eq('city', selectedCity)
          .limit(20000);
        setPreviewPincodes(data?.map(p => p.pincode) || []);
      } else if (bulkSelectionMode === 'search' && searchPincodes) {
        const pincodeList = searchPincodes.split(',').map(p => p.trim()).filter(p => p);
        if (pincodeList.length > 0) {
          const { data } = await supabase
            .from('pincodes')
            .select('pincode')
            .in('pincode', pincodeList)
            .limit(20000);
          setPreviewPincodes(data?.map(p => p.pincode) || []);
        } else {
          setPreviewPincodes([]);
        }
      } else if (bulkSelectionMode === 'selected') {
        setPreviewPincodes(Array.from(selectedPincodes));
      } else {
        setPreviewPincodes([]);
      }
    } catch (error) {
      console.error('Error previewing legacy bulk edit:', error);
      setPreviewPincodes([]);
    }
  };

  // Fetch pincodes when component mounts or when page/search changes
  useEffect(() => {
    fetchPincodes(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchPincodes]);

  // Fetch available states and cities when bulk edit modal opens
  useEffect(() => {
    if (showBulkEdit) {
      fetchStatesAndCities();
    }
  }, [showBulkEdit]);

  // Fetch available states and cities when bulk update modal opens
  useEffect(() => {
    if (showBulkUpdate) {
      fetchStatesAndCities();
    }
  }, [showBulkUpdate]);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedState && bulkSelectionMode === 'state') {
      fetchCitiesByState(selectedState);
    } else {
      setAvailableCities([]);
      setSelectedCity('');
    }
  }, [selectedState, bulkSelectionMode]);

  // Preview bulk update when scope or filters change
  useEffect(() => {
    if (showBulkUpdate) {
      // Validate scope requirements
      const isValidScope = 
        selectedScope === 'all' ||
        (selectedScope === 'state' && scopeValue) ||
        (selectedScope === 'city' && scopeValue) ||
        (selectedScope === 'single_pincode' && scopeValue) ||
        (selectedScope === 'multiple_pincodes' && multiplePincodes);
      
      if (isValidScope) {
        previewBulkUpdate();
      } else {
        setBulkPreviewCount(0);
        setBulkPreviewSample([]);
      }
    }
  }, [showBulkUpdate, selectedScope, scopeValue, multiplePincodes, getBulkUpdateCount]);

  // Preview legacy bulk edit when selection changes
  useEffect(() => {
    if (showBulkEdit) {
      previewLegacyBulkEdit();
    }
  }, [bulkSelectionMode, selectedState, selectedCity, searchPincodes, selectedPincodes, showBulkEdit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setCurrentPage(1);
  };

  const handleCreate = async (data: PincodeFormValues) => {
    try {
      await createPincode(data as Omit<PincodeDetails, 'created_at' | 'updated_at'>);
      toast.success('Pincode created successfully');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to create pincode');
    }
  };

  const handleUpdate = async (pincode: string, data: PincodeFormValues) => {
    try {
      await updatePincode(pincode, data as Partial<PincodeDetails>);
      toast.success('Pincode updated successfully');
      setEditingPincode(null);
    } catch (error) {
      toast.error('Failed to update pincode');
    }
  };

  const handleDelete = async (pincode: string) => {
    if (window.confirm('Are you sure you want to delete this pincode?')) {
      try {
        await deletePincode(pincode);
        toast.success('Pincode deleted successfully');
      } catch (error) {
        toast.error('Failed to delete pincode');
      }
    }
  };

  const toggleStatus = async (pincode: string, currentStatus: boolean) => {
    try {
      await updatePincode(pincode, { active: !currentStatus });
      toast.success(`Pincode ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update pincode status');
    }
  };

  const handleSelectPincode = (pincode: string) => {
    const newSelected = new Set(selectedPincodes);
    if (newSelected.has(pincode)) {
      newSelected.delete(pincode);
    } else {
      newSelected.add(pincode);
    }
    setSelectedPincodes(newSelected);
  };

  const handleSelectAll = async () => {
    if (selectAllMode === 'none' || selectAllMode === 'page') {
      // Select all pincodes across all pages
      try {
        const { data: allPincodes } = await supabase
          .from('pincodes')
          .select('pincode')
          .eq('active', true); // You can modify this filter as needed
        
        if (allPincodes) {
          setSelectedPincodes(new Set(allPincodes.map(p => p.pincode)));
          setSelectAllMode('all');
        }
      } catch (error) {
        console.error('Error fetching all pincodes:', error);
        toast.error('Failed to select all pincodes');
      }
    } else {
      // Deselect all
      setSelectedPincodes(new Set());
      setSelectAllMode('none');
    }
  };

  const handleSelectPage = () => {
    if (selectedPincodes.size === pincodes.length && selectAllMode === 'page') {
      setSelectedPincodes(new Set());
      setSelectAllMode('none');
    } else {
      setSelectedPincodes(new Set(pincodes.map(p => p.pincode)));
      setSelectAllMode('page');
    }
  };

  const handleBulkUpdate = async () => {
    // Handle bulk update modal (new approach)
    if (showBulkUpdate) {
      // Validate scope requirements
      const isValidScope = 
        selectedScope === 'all' ||
        (selectedScope === 'state' && scopeValue) ||
        (selectedScope === 'city' && scopeValue) ||
        (selectedScope === 'single_pincode' && scopeValue) ||
        (selectedScope === 'multiple_pincodes' && multiplePincodes);
      
      if (!isValidScope) {
        toast.error('Please fill in the required fields for the selected scope');
        return;
      }
      
      if (bulkPreviewCount === 0) {
        toast.error('No pincodes found matching the criteria');
        return;
      }
      
      try {
        const result = await bulkUpdatePincodes({
          field: selectedField,
          value: fieldValue,
          scope: selectedScope,
          ...(selectedScope === 'state' && { state: scopeValue }),
          ...(selectedScope === 'city' && { city: scopeValue }),
          ...(selectedScope === 'single_pincode' && { pincode: scopeValue.trim() }),
          ...(selectedScope === 'multiple_pincodes' && { 
            pincodes: multiplePincodes.split(/[\s,]+/).map(p => p.trim()).filter(p => p) 
          })
        });
        
        if (result.error) {
          toast.error(result.error);
          return;
        }
        
        toast.success(`Updated ${result.updatedCount} pincodes successfully`);
        
        // Refetch current page data
        await fetchPincodes(currentPage, searchTerm);
        
        // Reset and close modal
        setShowBulkUpdate(false);
        setSelectedScope('all');
        setScopeValue('');
        setMultiplePincodes('');
        setFieldValue(true);
        setBulkPreviewCount(null);
        setBulkPreviewSample([]);
        return;
        
      } catch (error) {
        console.error('Error in bulk update:', error);
        toast.error('Failed to update pincodes');
        return;
      }
    }
    
    // Handle legacy bulk edit
    let pincodesToUpdate: string[] = [];
    let updateData: any = {};
    
    if (bulkSelectionMode === 'selected') {
      pincodesToUpdate = Array.from(selectedPincodes);
    } else {
      pincodesToUpdate = previewPincodes;
    }
    
    if (pincodesToUpdate.length === 0) {
      toast.error('Please select pincodes to update');
      return;
    }

    try {
      // Only include fields that have been changed
      if (bulkEditData.is_serviceable !== false) {
        updateData.is_serviceable = bulkEditData.is_serviceable;
      }
      if (bulkEditData.cod_allowed !== false) {
        updateData.cod_allowed = bulkEditData.cod_allowed;
      }
      if (bulkEditData.min_order_amount !== '') {
        updateData.min_order_amount = Number(bulkEditData.min_order_amount);
      }
      if (bulkEditData.shipping_fee !== '') {
        updateData.shipping_fee = Number(bulkEditData.shipping_fee);
      }
      if (bulkEditData.cod_fee !== '') {
        updateData.cod_fee = Number(bulkEditData.cod_fee);
      }
      if (bulkEditData.free_shipping_threshold !== '') {
        updateData.free_shipping_threshold = Number(bulkEditData.free_shipping_threshold);
      }
      updateData.updated_at = new Date().toISOString();

      // Update all selected pincodes
      await Promise.all(
        pincodesToUpdate.map(pincode => 
          updatePincode(pincode, updateData)
        )
      );

      toast.success(`Updated ${pincodesToUpdate.length} pincodes successfully`);
      
      // Refetch current page data
      await fetchPincodes(currentPage, searchTerm);
      
      setSelectedPincodes(new Set());
      setShowBulkEdit(false);
      setBulkEditData({
        is_serviceable: false,
        cod_allowed: false,
        min_order_amount: '',
        shipping_fee: '',
        cod_fee: '',
        free_shipping_threshold: '',
      });
    } catch (error) {
      toast.error('Failed to update pincodes');
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Manage Pincodes</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowBulkUpdate(true)}
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/30 flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Bulk Update</span>
            <span className="xs:hidden">Bulk</span>
          </Button>
          <Button 
            onClick={() => setShowBulkEdit(true)}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/30 flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Edit3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Bulk Edit</span>
            <span className="xs:hidden">Bulk</span>
          </Button>
          {selectedPincodes.size > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowBulkEdit(true)}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Edit3 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Edit {selectedPincodes.size} Selected</span>
              <span className="xs:hidden">{selectedPincodes.size}</span>
            </Button>
          )}
          <Button 
            onClick={() => {
              setEditingPincode(null);
              setIsModalOpen(true);
            }} 
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Add New Pincode</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search pincodes, cities, or states..."
              className="pl-8 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" className="w-full sm:w-auto text-sm">
            Search
          </Button>
        </form>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="rounded-md border">
          <div className="relative w-full overflow-x-auto">
            <table className="w-full caption-bottom text-sm min-w-[600px]">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPincodes.size > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600"
                        title={selectAllMode === 'all' ? 'Deselect all pincodes' : 'Select all pincodes across all pages'}
                      />
                      <button
                        type="button"
                        onClick={handleSelectPage}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        title="Select/deselect current page only"
                      >
                        {selectedPincodes.size === pincodes.length && selectAllMode === 'page' ? 'Deselect Page' : 'Select Page'}
                      </button>
                    </div>
                  </th>
                  <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Pincode</th>
                  <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                  <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">Delivery Time</th>
                  <th className="h-12 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="h-12 px-2 sm:px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading && !pincodes.length ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-2 sm:p-4 align-middle"><Skeleton className="h-4 w-4" /></td>
                      <td className="p-2 sm:p-4 align-middle hidden sm:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-2 sm:p-4 align-middle">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 align-middle hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-2 sm:p-4 align-middle hidden lg:table-cell"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-2 sm:p-4 align-middle text-right">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : pincodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? 'No pincodes found' : 'No pincodes added yet'}
                    </td>
                  </tr>
                ) : (
                  pincodes.map((pincode) => (
                    <tr key={pincode.pincode} className={`border-b transition-colors hover:bg-muted/50 ${selectedPincodes.has(pincode.pincode) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="p-2 sm:p-4 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedPincodes.has(pincode.pincode)}
                          onChange={() => handleSelectPincode(pincode.pincode)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="p-2 sm:p-4 align-middle font-medium hidden sm:table-cell">{pincode.pincode}</td>
                      <td className="p-2 sm:p-4 align-middle">
                        <div className="font-medium text-sm sm:text-base">{pincode.city}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{pincode.state}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground sm:hidden">{pincode.pincode}</div>
                        {pincode.districts?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {pincode.districts.slice(0, 1).map((district, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {district}
                              </Badge>
                            ))}
                            {pincode.districts.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                +{pincode.districts.length - 1} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2 sm:p-4 align-middle hidden md:table-cell">{pincode.delivery_time || 'N/A'}</td>
                      <td className="p-2 sm:p-4 align-middle hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${pincode.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm">{pincode.active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 align-middle">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(pincode.pincode, pincode.active)}
                            title={pincode.active ? 'Deactivate' : 'Activate'}
                            className="h-6 w-6 sm:h-8 sm:w-8"
                          >
                            {pincode.active ? <X className="h-3 w-3 sm:h-4 sm:w-4" /> : <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPincode(pincode.pincode);
                              setIsModalOpen(true);
                            }}
                            title="Edit"
                            className="h-6 w-6 sm:h-8 sm:w-8"
                          >
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(pincode.pincode)}
                            title="Delete"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-6 w-6 sm:h-8 sm:w-8"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              {selectedPincodes.size > 0 && (
                <span className="mr-4">
                  {selectedPincodes.size} selected
                </span>
              )}
              Page {currentPage} of {totalPages} ({totalCount} total)
            </div>
            <div className="flex items-center space-x-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <PincodeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPincode(null);
        }}
        pincode={editingPincode}
        onSubmit={editingPincode ? (data) => handleUpdate(editingPincode, data) : handleCreate}
      />

      {/* New Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bulk Update – Pincodes
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBulkUpdate(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Field Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Field to Update</Label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value as BulkPincodeUpdateRequest['field'])}
                  className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                >
                  <option value="is_serviceable">Serviceable Status</option>
                  <option value="cod_allowed">Cash on Delivery</option>
                  <option value="delivery_time">Delivery Time</option>
                  <option value="min_order_amount">Minimum Order Amount</option>
                  <option value="shipping_fee">Shipping Fee</option>
                  <option value="cod_fee">COD Fee</option>
                  <option value="free_shipping_threshold">Free Shipping Threshold</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Scope</Label>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value as BulkPincodeUpdateRequest['scope'])}
                  className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All pincodes</option>
                  <option value="state">By state</option>
                  <option value="city">By city</option>
                  <option value="single_pincode">Single pincode</option>
                  <option value="multiple_pincodes">Multiple pincodes</option>
                </select>
              </div>

              {/* Dynamic Scope Input */}
              {selectedScope === 'state' && (
                <div className="space-y-2">
                  <Label htmlFor="scope_state">State</Label>
                  <select
                    id="scope_state"
                    value={scopeValue}
                    onChange={(e) => setScopeValue(e.target.value)}
                    className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select a state...</option>
                    {ALL_INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedScope === 'city' && (
                <div className="space-y-2">
                  <Label htmlFor="scope_city">City</Label>
                  <Input
                    id="scope_city"
                    value={scopeValue}
                    onChange={(e) => setScopeValue(e.target.value)}
                    placeholder="Enter city name..."
                    className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              {selectedScope === 'single_pincode' && (
                <div className="space-y-2">
                  <Label htmlFor="scope_pincode">Pincode</Label>
                  <Input
                    id="scope_pincode"
                    value={scopeValue}
                    onChange={(e) => setScopeValue(e.target.value)}
                    placeholder="Enter pincode..."
                    className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              {selectedScope === 'multiple_pincodes' && (
                <div className="space-y-2">
                  <Label htmlFor="scope_multiple">Pincodes (comma-separated)</Label>
                  <textarea
                    id="scope_multiple"
                    value={multiplePincodes}
                    onChange={(e) => setMultiplePincodes(e.target.value)}
                    placeholder="Enter pincodes separated by commas...&#10;Example: 110001, 110002, 110003"
                    className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 min-h-[80px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can paste multiple pincodes at once, separated by commas or new lines
                  </p>
                </div>
              )}

              {/* Value Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Value</Label>
                {(selectedField === 'is_serviceable' || selectedField === 'cod_allowed') ? (
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={selectedField}
                        value="true"
                        checked={fieldValue === true}
                        onChange={() => setFieldValue(true)}
                        className="mr-2"
                      />
                      True
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={selectedField}
                        value="false"
                        checked={fieldValue === false}
                        onChange={() => setFieldValue(false)}
                        className="mr-2"
                      />
                      False
                    </label>
                  </div>
                ) : selectedField === 'delivery_time' ? (
                  <Input
                    value={fieldValue as string}
                    onChange={(e) => setFieldValue(e.target.value)}
                    placeholder="e.g., 2-3 days, Same-day, Next-day"
                    className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fieldValue as number}
                    onChange={(e) => setFieldValue(Number(e.target.value))}
                    placeholder="Enter amount..."
                    className="w-full border rounded-lg p-2 bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                )}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Pincodes to Update {loadingBulkPreview && '(Loading...)'}
                </Label>
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700 max-h-32 overflow-y-auto">
                  {bulkPreviewSample.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {bulkPreviewSample.map(pincode => (
                        <span key={pincode} className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded">
                          {pincode}
                        </span>
                      ))}
                      {bulkPreviewCount && bulkPreviewCount > bulkPreviewSample.length && (
                        <span className="inline-block bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded">
                          +{bulkPreviewCount - bulkPreviewSample.length} more...
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {loadingBulkPreview ? 'Loading...' : 'No pincodes found for the selected criteria'}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {bulkPreviewCount ?? 0} pincodes
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowBulkUpdate(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loadingBulkPreview || bulkPreviewCount === 0 || (selectedScope !== 'all' && !scopeValue && !multiplePincodes)}
              >
                Update {bulkPreviewCount ?? 0} Pincodes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bulk Edit – Pincodes</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBulkEdit(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border dark:border-gray-600 p-4">
                  <div>
                    <h4 className="font-medium">Serviceable Area</h4>
                    <p className="text-sm text-muted-foreground">
                      Mark selected areas as serviceable
                    </p>
                  </div>
                  <Switch
                    checked={bulkEditData.is_serviceable}
                    onCheckedChange={(checked) => 
                      setBulkEditData(prev => ({ ...prev, is_serviceable: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border dark:border-gray-600 p-4">
                  <div>
                    <h4 className="font-medium">Cash on Delivery</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable COD for selected areas
                    </p>
                  </div>
                  <Switch
                    checked={bulkEditData.cod_allowed}
                    onCheckedChange={(checked) => 
                      setBulkEditData(prev => ({ ...prev, cod_allowed: checked }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk_min_order">Minimum Order Amount (₹)</Label>
                  <Input
                    id="bulk_min_order"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Leave empty to keep current"
                    value={bulkEditData.min_order_amount}
                    onChange={(e) => 
                      setBulkEditData(prev => ({ ...prev, min_order_amount: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk_shipping">Shipping Fee (₹)</Label>
                  <Input
                    id="bulk_shipping"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Leave empty to keep current"
                    value={bulkEditData.shipping_fee}
                    onChange={(e) => 
                      setBulkEditData(prev => ({ ...prev, shipping_fee: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk_cod">COD Fee (₹)</Label>
                  <Input
                    id="bulk_cod"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Leave empty to keep current"
                    value={bulkEditData.cod_fee}
                    onChange={(e) => 
                      setBulkEditData(prev => ({ ...prev, cod_fee: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk_free_shipping">Free Shipping Threshold (₹)</Label>
                  <Input
                    id="bulk_free_shipping"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Leave empty to keep current"
                    value={bulkEditData.free_shipping_threshold}
                    onChange={(e) => 
                      setBulkEditData(prev => ({ ...prev, free_shipping_threshold: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowBulkEdit(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loadingBulkPreview || bulkPreviewCount === 0 || (selectedScope !== 'all' && !scopeValue && !multiplePincodes)}
              >
                Update {bulkPreviewCount ?? 0} Pincodes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
