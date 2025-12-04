import { useState, useEffect } from 'react';
import { usePincodeStore, type PincodeDetails } from '@/store/pincodeStore';
import { X, MapPin, Clock, Package, DollarSign, X as XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/LabelSimple';
import { Switch } from '@/components/ui/SwitchSimple';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/DialogSimple';
import { toast } from 'sonner';

const pincodeSchema = z.object({
  pincode: z.string().min(6, 'Pincode must be at least 6 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  districts: z.array(z.string().min(1, 'District cannot be empty')),
  active: z.boolean(),
  is_serviceable: z.boolean(),
  cod_allowed: z.boolean(),
  min_order_amount: z.number().min(0, 'Cannot be negative'),
  shipping_fee: z.number().min(0, 'Cannot be negative'),
  cod_fee: z.number().min(0, 'Cannot be negative'),
  free_shipping_threshold: z.number().min(0, 'Cannot be negative').nullable(),
  delivery_time: z.string().min(1, 'Delivery time is required'),
});

export type PincodeFormValues = z.infer<typeof pincodeSchema>;

interface PincodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pincode?: string | null;
  onSubmit: (data: PincodeFormValues) => Promise<void>;
}

export const PincodeModal = ({ isOpen, onClose, pincode, onSubmit }: PincodeModalProps) => {
  const [activeTab, setActiveTab] = useState<'location' | 'settings' | 'financials'>('location');
  const [isLoading, setIsLoading] = useState(false);
  const [districtInput, setDistrictInput] = useState('');
  const { fetchDetails } = usePincodeStore();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PincodeFormValues>({
    resolver: zodResolver(pincodeSchema),
    defaultValues: {
      pincode: '',
      city: '',
      state: '',
      districts: [],
      active: true,
      is_serviceable: true,
      cod_allowed: true,
      min_order_amount: 0,
      shipping_fee: 0,
      cod_fee: 0,
      free_shipping_threshold: null,
      delivery_time: '3-5 days',
    },
  });

  const districts = watch('districts');
  const isServiceable = watch('is_serviceable');
  const codAllowed = watch('cod_allowed');

  // Load pincode data when editing
  useEffect(() => {
    if (!isOpen || !pincode) {
      reset();
      return;
    }

    const loadPincodeData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDetails(pincode);
        if (data) {
          reset({
            ...data,
            // Ensure all required fields have values
            districts: data.districts || [],
            min_order_amount: data.min_order_amount || 0,
            shipping_fee: data.shipping_fee || 0,
            cod_fee: data.cod_fee || 0,
          });
        }
      } catch (error) {
        console.error('Error loading pincode data:', error);
        toast.error('Failed to load pincode data');
      } finally {
        setIsLoading(false);
      }
    };

    loadPincodeData();
  }, [isOpen, pincode, reset, fetchDetails]);

  const handleAddDistrict = () => {
    const district = districtInput.trim();
    if (district && !districts.includes(district)) {
      setValue('districts', [...districts, district]);
      setDistrictInput('');
    }
  };

  const handleRemoveDistrict = (districtToRemove: string) => {
    setValue(
      'districts',
      districts.filter((d) => d !== districtToRemove)
    );
  };

  const processSubmit = async (data: PincodeFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting pincode:', error);
      toast.error('Failed to save pincode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-auto">
        <DialogClose onClick={onClose} />
        <DialogHeader>
          <DialogTitle>{pincode ? 'Edit Pincode' : 'Add New Pincode'}</DialogTitle>
          <DialogDescription>
            {pincode
              ? 'Update the pincode details below.'
              : 'Add a new pincode and configure its delivery settings.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
          {/* Custom Tab Navigation */}
          <div className="flex flex-col sm:flex-row border-b">
            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={`flex items-center px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'location'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Location
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('financials')}
              className={`flex items-center px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'financials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Financials
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'location' && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="Enter pincode"
                    disabled={!!pincode}
                    {...register('pincode')}
                  />
                  {errors.pincode && (
                    <p className="text-sm text-red-500">{errors.pincode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" placeholder="Enter city" {...register('city')} />
                  {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" placeholder="Enter state" {...register('state')} />
                  {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Delivery Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="delivery_time"
                      placeholder="e.g., 3-5 days"
                      className="pl-9"
                      {...register('delivery_time')}
                    />
                  </div>
                  {errors.delivery_time && (
                    <p className="text-sm text-red-500">{errors.delivery_time.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Districts</Label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input
                    value={districtInput}
                    onChange={(e) => setDistrictInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDistrict())}
                    placeholder="Add district and press Enter"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddDistrict} variant="outline" className="w-full sm:w-auto">
                    Add
                  </Button>
                </div>
                {districts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {districts.map((district) => (
                      <div
                        key={district}
                        className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                      >
                        {district}
                        <button
                          type="button"
                          onClick={() => handleRemoveDistrict(district)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/10"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">Active</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {watch('active') ? 'Pincode is active' : 'Pincode is inactive'}
                    </p>
                  </div>
                  <Switch
                    checked={watch('active')}
                    onCheckedChange={(checked) => setValue('active', checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">Serviceable Area</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {isServiceable ? 'This area is serviceable' : 'This area is not serviceable'}
                    </p>
                  </div>
                  <Switch
                    checked={isServiceable}
                    onCheckedChange={(checked) => setValue('is_serviceable', checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">Cash on Delivery</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {codAllowed ? 'COD is available' : 'COD is not available'}
                    </p>
                  </div>
                  <Switch
                    checked={codAllowed}
                    onCheckedChange={(checked) => setValue('cod_allowed', checked)}
                    disabled={!isServiceable}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_amount">Minimum Order Amount (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="min_order_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-9"
                      {...register('min_order_amount', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.min_order_amount && (
                    <p className="text-sm text-red-500">{errors.min_order_amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_fee">Shipping Fee (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="shipping_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-9"
                      {...register('shipping_fee', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.shipping_fee && (
                    <p className="text-sm text-red-500">{errors.shipping_fee.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cod_fee">COD Fee (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cod_fee"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-9"
                      disabled={!codAllowed}
                      {...register('cod_fee', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.cod_fee && (
                    <p className="text-sm text-red-500">{errors.cod_fee.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="free_shipping_threshold">
                    Free Shipping Threshold (₹) <span className="text-muted-foreground">optional</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="free_shipping_threshold"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-9"
                      {...register('free_shipping_threshold', {
                        setValueAs: (v) => (v === '' ? null : Number(v)),
                      })}
                    />
                  </div>
                  {errors.free_shipping_threshold && (
                    <p className="text-sm text-red-500">{errors.free_shipping_threshold.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
