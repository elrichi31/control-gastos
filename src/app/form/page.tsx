"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Trash2, DollarSign, Calendar, Tag, CreditCard } from "lucide-react"
import { v4 as uuidv4 } from "uuid";


interface Expense {
    id: string
    description: string
    amount: number
    category: string
    date: string
    paymentMethod: string
}

const categories = [
    "Alimentación",
    "Transporte",
    "Entretenimiento",
    "Salud",
    "Educación",
    "Compras",
    "Servicios",
    "Otros",
]

const paymentMethods = ["Efectivo", "Tarjeta de débito", "Tarjeta de crédito", "Transferencia", "Otro"]

const categoryColors: { [key: string]: string } = {
    Alimentación: "bg-green-100 text-green-800",
    Transporte: "bg-blue-100 text-blue-800",
    Entretenimiento: "bg-purple-100 text-purple-800",
    Salud: "bg-red-100 text-red-800",
    Educación: "bg-yellow-100 text-yellow-800",
    Compras: "bg-pink-100 text-pink-800",
    Servicios: "bg-gray-100 text-gray-800",
    Otros: "bg-orange-100 text-orange-800",
}

export default function ExpenseTracker() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "",
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
        paymentMethod: "",
    })

    const fetchExpenses = async () => {
        try {
            const res = await fetch("/api/gastos");
            const data = await res.json();
            console.log("Datos obtenidos del backend:", data);

            const today = new Date();
            const last7days = new Date(today);
            last7days.setDate(today.getDate() - 7);

            const recent = data.filter((item: any) => {
                const date = new Date(item.date);
                return date >= last7days && date <= today;
            });

            const formatted = recent.map((e: any) => ({
                id: e.id,
                description: e.description,
                amount: parseFloat(e.amount),
                category: e.category,
                date: e.date,
                paymentMethod: e.paymentMethod,
            }));

            setExpenses(formatted);
        } catch (err) {
            console.error("Error al obtener datos del backend", err);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchExpenses();
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description || !formData.amount || !formData.category || !formData.paymentMethod) {
            alert("Por favor completa todos los campos");
            return;
        }

        const newExpense: Expense = {
            id: uuidv4(), // UUID único
            description: formData.description,
            amount: Number.parseFloat(formData.amount),
            category: formData.category,
            date: formData.date,
            paymentMethod: formData.paymentMethod,
        };
        console.log("Nuevo gasto a enviar:", newExpense);


        try {
            await fetch("/api/gastos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newExpense),
            });

            // volver a cargar desde Google Sheets
            fetchExpenses();
        } catch (error) {
            console.error("Error al enviar al Google Sheet:", error);
            alert("Ocurrió un error al guardar en Google Sheets");
            return;
        }

        setFormData({
            description: "",
            amount: "",
            category: "",
            date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
            paymentMethod: "",
        });
    };

    const deleteExpense = async (id: string) => {
        try {
            await fetch("/api/delete-gasto", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "delete", id }),
            });

            setExpenses((prev) => prev.filter((expense) => expense.id !== id));
        } catch (error) {
            console.error("Error al eliminar gasto:", error);
            alert("Ocurrió un error al eliminar el gasto");
        }
    };



    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Control de Gastos Personales</h1>
                <p className="text-gray-600 mt-2">Registra y controla tus gastos diarios</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Formulario de registro */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Registrar Nuevo Gasto
                        </CardTitle>
                        <CardDescription>Completa la información del gasto que deseas registrar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Ej: Almuerzo en restaurante"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto ($)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date">Fecha</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentMethod">Método de Pago</Label>
                                <Select
                                    value={formData.paymentMethod}
                                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona método de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="w-full">
                                Registrar Gasto
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Resumen y lista de gastos */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">Total de gastos</p>
                                <p className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                                <p className="text-sm text-gray-600 mt-1">{expenses.length} gastos registrados</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gastos Recientes</CardTitle>
                            <CardDescription>Últimos gastos registrados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {isLoading ? (
                                    <p className="text-center text-gray-500 py-8">Cargando gastos...</p>
                                ) : expenses.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No hay gastos registrados aún</p>
                                ) : (
                                    expenses.map((expense) => (
                                        <div key={expense.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{expense.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge className={categoryColors[expense.category] || "bg-gray-100 text-gray-800"}>
                                                            <Tag className="h-3 w-3 mr-1" />
                                                            {expense.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-600">${expense.amount.toFixed(2)}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteExpense(expense.id)}
                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(expense.date).toLocaleDateString("es-ES")}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {expense.paymentMethod}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
