import { Order } from "@/types/interfaces";

function formatOrderTime(date: Date): string {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    date
  );
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${time}, ${weekday}, ${day}/${month}/${year}`;
}

// ---------------------------
// CUSTOMER ORDERS
// ---------------------------
export const orders: Order[] = [
  {
    orderId: 101,
    user: {
      firstName: "Maria",
      lastName: "Santos",
      middleName: "L.",
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 20, 9, 20),
    formattedTime: formatOrderTime(new Date(2025, 7, 20, 9, 20)),
    locationBought: "Jollibee SM Downtown",
    specification: "2pc Chickenjoy with Spaghetti Combo",
    instructions: "Extra gravy, less ice on drink",
    placeDelivered: "Ateneo Dormitory, Room 204",
    fee: 75,
  },
  {
    orderId: 102,
    user: {
      firstName: "John",
      lastName: "Reyes",
      middleName: "M.",
    },
    orderStatus: "Pending",
    orderTime: new Date(2025, 7, 21, 14, 35),
    formattedTime: formatOrderTime(new Date(2025, 7, 21, 14, 35)),
    locationBought: "7-Eleven Loyola Street",
    specification: "Bottled water, sandwich, and chips",
    instructions: "Leave at front desk if no answer",
    placeDelivered: "Loyola Hall, Room 310",
    fee: 45,
  },
  {
    orderId: 103,
    user: {
      firstName: "Alyssa",
      lastName: "Cruz",
      middleName: "T.",
    },
    orderStatus: "In Transit",
    orderTime: new Date(2025, 7, 22, 11, 50),
    formattedTime: formatOrderTime(new Date(2025, 7, 22, 11, 50)),
    locationBought: "McDonald's Katipunan",
    specification: "McChicken Meal, Coke Zero",
    instructions: "Knock twice before handing over",
    placeDelivered: "Blue Residences Tower 2, Unit 1801",
    fee: 65,
  },
  {
    orderId: 104,
    user: {
      firstName: "Kevin",
      lastName: "Tan",
      middleName: null,
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 22, 18, 10),
    formattedTime: formatOrderTime(new Date(2025, 7, 22, 18, 10)),
    locationBought: "Watsons Gateway Mall",
    specification: "Vitamin C tablets and face mask pack",
    instructions: "Cancel if not available in stock",
    placeDelivered: "One Katipunan Apartments, Room 302",
    fee: 50,
  },
  {
    orderId: 105,
    user: {
      firstName: "Nicole",
      lastName: "Garcia",
      middleName: "R.",
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 23, 8, 45),
    formattedTime: formatOrderTime(new Date(2025, 7, 23, 8, 45)),
    locationBought: "Starbucks Katipunan",
    specification: "Iced Caramel Macchiato, Grande",
    instructions: "No whipped cream, paper straw only",
    placeDelivered: "Ateneo Library Lobby",
    fee: 60,
  },
];

// ---------------------------
// COURIER DELIVERIES
// ---------------------------
export const deliveries: Order[] = [
  {
    orderId: 201,
    user: {
      firstName: "Christian",
      lastName: "Osorno",
      middleName: null,
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 20, 10, 15),
    formattedTime: formatOrderTime(new Date(2025, 7, 20, 10, 15)),
    locationBought: "GrabFood Hub Katipunan",
    specification: "Burger King order for Customer #431",
    instructions: "Deliver while hot, confirm via call",
    placeDelivered: "Regis Center, Unit 1205",
    fee: 80,
  },
  {
    orderId: 202,
    user: {
      firstName: "Rafael",
      lastName: "Lim",
      middleName: "P.",
    },
    orderStatus: "In Transit",
    orderTime: new Date(2025, 7, 21, 13, 40),
    formattedTime: formatOrderTime(new Date(2025, 7, 21, 13, 40)),
    locationBought: "Mercury Drug Aurora Blvd",
    specification: "Prescription meds for John Santos",
    instructions: "Require signature upon delivery",
    placeDelivered: "Loyola Heights Village, House 45",
    fee: 55,
  },
  {
    orderId: 203,
    user: {
      firstName: "Bea",
      lastName: "Mendoza",
      middleName: "Q.",
    },
    orderStatus: "Pending",
    orderTime: new Date(2025, 7, 22, 15, 10),
    formattedTime: formatOrderTime(new Date(2025, 7, 22, 15, 10)),
    locationBought: "Chowking Katipunan",
    specification: "Beef Chao Fan, Halo-Halo",
    instructions: "Bring change for ₱500",
    placeDelivered: "UP Town Center, Food Court Entrance",
    fee: 70,
  },
  {
    orderId: 204,
    user: {
      firstName: "Erica",
      lastName: "Villanueva",
      middleName: "D.",
    },
    orderStatus: "Cancelled",
    orderTime: new Date(2025, 7, 23, 17, 5),
    formattedTime: formatOrderTime(new Date(2025, 7, 23, 17, 5)),
    locationBought: "FamilyMart Aurora Blvd",
    specification: "Assorted snacks and drinks pack",
    instructions: "Cancelled by customer before pickup",
    placeDelivered: "Miriam College Gate 3",
    fee: 40,
  },
  {
    orderId: 205,
    user: {
      firstName: "Ivan",
      lastName: "Delos Reyes",
      middleName: null,
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 24, 9, 30),
    formattedTime: formatOrderTime(new Date(2025, 7, 24, 9, 30)),
    locationBought: "The Coffee Bean Gateway Mall",
    specification: "Cappuccino and blueberry muffin",
    instructions: "Deliver to office reception",
    placeDelivered: "Tech Hub Building, 5th Floor",
    fee: 65,
  },
];
