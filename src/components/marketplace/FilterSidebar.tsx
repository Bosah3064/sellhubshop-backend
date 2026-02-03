
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, CheckCircle2, RotateCcw, Sparkles, Star, Shield, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import kenyanLocations from "@/data/kenyan-locations.json";

interface FilterSidebarProps {
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    priceRange: [number, number];
    onPriceRangeChange: (value: [number, number]) => void;
    conditions: string[];
    onConditionChange: (condition: string) => void;
    verifiedOnly: boolean;
    onVerifiedChange: (verified: boolean) => void;
    onReset: () => void;
    className?: string;
    selectedCounty?: string;
    onCountyChange?: (county: string) => void;
    selectedNeighborhood?: string;
    onNeighborhoodChange?: (neighborhood: string) => void;
}

export function FilterSidebar({
    categories,
    selectedCategory,
    onCategoryChange,
    priceRange,
    onPriceRangeChange,
    conditions,
    onConditionChange,
    verifiedOnly,
    onVerifiedChange,
    onReset,
    className = "",
    selectedCounty = "",
    onCountyChange,
    selectedNeighborhood = "",
    onNeighborhoodChange,
}: FilterSidebarProps) {
    const [counties, setCounties] = useState<{ id: string, name: string }[]>([]);
    const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchCounties();
    }, []);


    useEffect(() => {
        if (selectedCounty) {
            fetchLocations(selectedCounty);
        } else {
            setLocations([]);
        }
    }, [selectedCounty]);


    const fetchCounties = async () => {
        // Use local JSON for consistency
        const countiesData = (kenyanLocations as any).counties.map((c: any) => ({
            id: c.id,
            name: c.name
        }));
        setCounties(countiesData);
    };

    const fetchLocations = async (countyIdOrName: string) => {
        const county = (kenyanLocations as any).counties.find(
            (c: any) => c.id === countyIdOrName || c.name === countyIdOrName
        );
        if (county) {
            setLocations(county.locations.map((l: string) => ({ id: l, name: l })));
        } else {
            setLocations([]);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className={`space-y-6 bg-white p-4 rounded-lg border border-gray-100 h-fit ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="text-muted-foreground hover:text-primary h-8"
                >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Reset
                </Button>
            </div>

            {/* Verified Only Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <Label htmlFor="verified-mode" className="font-medium cursor-pointer">Verified Only</Label>
                </div>
                <Switch
                    id="verified-mode"
                    checked={verifiedOnly}
                    onCheckedChange={onVerifiedChange}
                />
            </div>

            {/* County Filter */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
                <Label className="text-sm font-medium">County</Label>
                <div className="relative">
                    <select
                        value={selectedCounty}
                        onChange={(e) => onCountyChange?.(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    >
                        <option value="">All Counties</option>
                        {counties.map((c, index) => <option key={`${c.id}-${index}`} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
                <Label className="text-sm font-medium">Specific Area</Label>
                <div className="relative">
                    <select
                        value={selectedNeighborhood}
                        onChange={(e) => onNeighborhoodChange?.(e.target.value)}
                        disabled={!selectedCounty}
                        className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                        <option value="">{selectedCounty ? "All Areas" : "Select County first"}</option>
                        {locations.map((l, index) => <option key={`${l.id}-${index}`} value={l.name}>{l.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Price Range</Label>
                    <span className="text-xs text-muted-foreground">
                        {formatPrice(priceRange[0])} - {priceRange[1] >= 1000000 ? "1M+" : formatPrice(priceRange[1])}
                    </span>
                </div>
                <Slider
                    defaultValue={[0, 1000000]}
                    min={0}
                    max={1000000}
                    step={1000}
                    value={[priceRange[0], priceRange[1]]}
                    onValueChange={(val) => onPriceRangeChange([val[0], val[1]])}
                    className="py-4"
                />
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                        className="h-8 text-xs"
                        placeholder="Min"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                        className="h-8 text-xs"
                        placeholder="Max"
                    />
                </div>
            </div>

            {/* Condition */}
            <div className="space-y-4 pb-6 border-b border-gray-100">
                <Label className="text-sm font-semibold text-gray-900">Condition</Label>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: "New", icon: Sparkles },
                        { label: "Used - Like New", icon: Star },
                        { label: "Used - Good", icon: Shield },
                        { label: "Refurbished", icon: RotateCcw }
                    ].map(({ label, icon: Icon }) => (
                        <Button
                            key={label}
                            type="button"
                            variant={conditions.includes(label) ? "default" : "outline"}
                            size="sm"
                            className={`
                                rounded-full h-9 px-4 text-xs font-medium transition-all duration-200
                                ${conditions.includes(label)
                                    ? "bg-primary text-white border-primary shadow-md"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                                }
                            `}
                            onClick={() => onConditionChange(label)}
                        >
                            <Icon className={`h-3 w-3 mr-2 ${conditions.includes(label) ? "text-white" : "text-primary"}`} />
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Categories</Label>
                <RadioGroup value={selectedCategory} onValueChange={onCategoryChange} className="space-y-1">
                    {categories.slice(0, 10).map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                            <RadioGroupItem value={category} id={`cat-${category}`} />
                            <Label htmlFor={`cat-${category}`} className="text-sm font-normal cursor-pointer">
                                {category}
                            </Label>
                        </div>
                    ))}
                    {/* Show remaining categories in a collapsible or just scroll? For now limiting to 10 */}
                </RadioGroup>
            </div>
        </div>
    );
}
