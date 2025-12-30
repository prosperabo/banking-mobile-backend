import { SimplifiedTransaction } from '../schemas/transactions.schemas';

export const getMockTransactions = (): SimplifiedTransaction[] => {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  // Helper para crear fechas en formato string ISO
  const getDateStr = (date: Date) => date.toISOString();

  // Helper para restar días
  const minusDays = (days: number) => new Date(now.getTime() - days * oneDay);

  // Helper para restar meses
  const minusMonths = (months: number) =>
    new Date(now.getFullYear(), now.getMonth() - months, 15);

  return [
    // --- DATOS PARA VISTA DIARIA (Semana Actual) ---
    // Hoy (Supongamos un gasto alto)
    {
      id: 1,
      date: getDateStr(now),
      title: 'Gasto Hoy',
      category: 'Shopping',
      amount: 5000,
    },

    // Ayer (Gasto menor, para ver incremento hoy)
    {
      id: 2,
      date: getDateStr(minusDays(1)),
      title: 'Cena Ayer',
      category: 'Food',
      amount: 2500,
    },

    // Antier (Gasto bajo)
    {
      id: 3,
      date: getDateStr(minusDays(2)),
      title: 'Uber',
      category: 'Transport',
      amount: 800,
    },

    // Hace 3 días
    {
      id: 4,
      date: getDateStr(minusDays(3)),
      title: 'Supermercado',
      category: 'Grocery',
      amount: 1200,
    },

    // --- DATOS PARA VISTA MENSUAL (Últimos meses) ---
    // Nota: El "mes actual" se sumará con los datos de arriba si caen en este mes.

    // Mes Pasado (Hace 1 mes)
    {
      id: 10,
      date: getDateStr(minusMonths(1)),
      title: 'Renta',
      category: 'Bills',
      amount: 12000,
    },
    {
      id: 11,
      date: getDateStr(minusMonths(1)),
      title: 'Luz',
      category: 'Bills',
      amount: 1500,
    }, // Dos tx en el mismo mes

    // Hace 2 meses
    {
      id: 12,
      date: getDateStr(minusMonths(2)),
      title: 'Viaje',
      category: 'Travel',
      amount: 8500,
    },

    // Hace 3 meses (Monto bajo para ver subida)
    {
      id: 13,
      date: getDateStr(minusMonths(3)),
      title: 'Suscripciones',
      category: 'Entertainment',
      amount: 5000,
    },

    // Hace 4 meses
    {
      id: 14,
      date: getDateStr(minusMonths(4)),
      title: 'Mantenimiento',
      category: 'Services',
      amount: 6000,
    },
  ];
};
