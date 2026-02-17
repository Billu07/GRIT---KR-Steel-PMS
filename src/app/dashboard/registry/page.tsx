"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EquipmentModal from "@/components/EquipmentModal";
import { Search, Plus } from "lucide-react";

export default function RegistryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/reports") // Reusing this endpoint as it returns all equipment
      .then((res) => res.json())
      .then((data) => {
        setEquipment(data.equipment || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateEquipment = async (newEquipment: any) => {
    try {
      const res = await fetch("/api/equipment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEquipment),
      });

      if (res.ok) {
        // Refresh the list to show new equipment (and get joined category name)
        fetch("/api/reports")
          .then((res) => res.json())
          .then((data) => setEquipment(data.equipment || []));

        setIsEquipmentModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create equipment");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating equipment");
    }
  };

  const filteredEquipment = equipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.code.toLowerCase().includes(search.toLowerCase()) ||
      (eq.location && eq.location.toLowerCase().includes(search.toLowerCase())),
  );

  if (loading) return <div className="p-8">Loading Registry...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Equipment Registry
          </h1>
          <p className="text-sm text-gray-500">
            Master list of all facility equipment
          </p>
        </div>
        <Button
          onClick={() => setIsEquipmentModalOpen(true)}
          className="mt-4 md:mt-0 flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Add Equipment
        </Button>
      </div>

      <Card className="mb-6 border border-gray-200 shadow-none">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
            placeholder="Search by name, code, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card
        title={`Total Equipment: ${filteredEquipment.length}`}
        className="border border-gray-200 shadow-none"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredEquipment.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filteredEquipment.map((eq: any) => (
                  <tr
                    key={eq.id}
                    className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {eq.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {eq.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {eq.category?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {eq.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-sm 
                        ${eq.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No equipment found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EquipmentModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        onSubmit={handleCreateEquipment}
        categoryId={null}
      />
    </div>
  );
}
