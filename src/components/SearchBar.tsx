import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
}

export function SearchBar({ placeholder = "Buscar...", onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-md">
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1"
            />
            <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
            </Button>
        </form>
    );
}
