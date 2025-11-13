import { Order } from "@/types/interfaces";

export const order_list: Order[] = [
  {
    orderId: 101,
    user: {
      firstName: "Christian",
      lastName: "Osorno",
      middleName: null,
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 20, 9, 20),
    formattedTime: undefined,
    locationBought: "Jollibee SM Downtown",
    specification: "2pc Chickenjoy with Spaghetti Combo",
    instructions: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sagittis dolor non orci euismod sodales ut eu risus. Sed vel nunc sit amet nulla elementum semper ac vel eros. Morbi rhoncus nunc vel tincidunt dapibus. Nullam faucibus pulvinar lacus ut dignissim. Donec ac dapibus leo, eget convallis mi. Quisque a eleifend leo, vel placerat lectus. Vivamus tempor scelerisque erat ac imperdiet. Cras condimentum tellus non dictum auctor. Aenean at tempus nulla. Aliquam euismod euismod dictum. Integer id nulla fermentum, feugiat est et, accumsan felis. Donec posuere, urna a volutpat sodales, turpis nunc rhoncus elit, et bibendum ipsum dolor sed risus. Duis lacus sapien, tristique id magna sed, vehicula sollicitudin dui.

Ut nunc ligula, euismod sed condimentum ut, lobortis id lorem. Nam accumsan auctor turpis eget vulputate. In sodales lorem lorem, eget vehicula mi fermentum sed. Praesent eros velit, hendrerit non tincidunt sit amet, sagittis id mi. Proin ut justo leo. Vestibulum eget tortor convallis, tristique orci at, semper mi. Quisque pretium, sem semper suscipit imperdiet, arcu eros sollicitudin massa, gravida tristique ex turpis nec odio. Nam vitae ante at lorem sollicitudin ornare.

Curabitur gravida ipsum at lacus commodo mattis. Fusce tincidunt nulla nec elementum euismod. Nunc feugiat dignissim orci vitae scelerisque. Duis eget consectetur turpis. Praesent tortor augue, sagittis ac orci eget, molestie blandit ligula. Nulla gravida neque non commodo auctor. Mauris faucibus risus urna, sed lacinia sem egestas non. Duis iaculis gravida massa, vitae hendrerit ante faucibus at. Vestibulum volutpat libero vitae massa dictum, eget pharetra nulla imperdiet. Praesent tempor leo id imperdiet tempor. Praesent venenatis ullamcorper orci, elementum sollicitudin justo. Praesent eget orci condimentum, dapibus tortor id, condimentum libero. Praesent hendrerit dolor at pellentesque bibendum.`,
    placeDelivered: "Ateneo Dormitory, Room 204",
    fee: 75,
  },
  {
    orderId: 102,
    user: {
      firstName: "Andrea",
      lastName: "Santos",
      middleName: null,
    },
    orderStatus: "Pending",
    orderTime: new Date(2025, 7, 21, 14, 35),
    formattedTime: undefined,
    locationBought: "7-Eleven Loyola Street",
    specification: "Bottled water, sandwich, and chips",
    instructions: "Leave at front desk if no answer",
    placeDelivered: "Loyola Hall, Room 310",
    fee: 45,
  },
  {
    orderId: 103,
    user: {
      firstName: "Miguel",
      lastName: "De Vera",
      middleName: null,
    },
    orderStatus: "In Transit",
    orderTime: new Date(2025, 7, 22, 11, 50),
    formattedTime: undefined,
    locationBought: "McDonald's Katipunan",
    specification: "McChicken Meal, Coke Zero",
    instructions: "Knock twice before handing over",
    placeDelivered: "Blue Residences Tower 2, Unit 1801",
    fee: 65,
  },
  {
    orderId: 104,
    user: {
      firstName: "Lara",
      lastName: "Velasquez",
      middleName: null,
    },
    orderStatus: "Cancelled",
    orderTime: new Date(2025, 7, 22, 18, 10),
    formattedTime: undefined,
    locationBought: "Watsons Gateway Mall",
    specification: "Vitamin C tablets and face mask pack",
    instructions: "Cancel if not available in stock",
    placeDelivered: "One Katipunan Apartments, Room 302",
    fee: 50,
  },
  {
    orderId: 105,
    user: {
      firstName: "Joshua",
      lastName: "Reyes",
      middleName: null,
    },
    orderStatus: "Delivered",
    orderTime: new Date(2025, 7, 23, 8, 45),
    formattedTime: undefined,
    locationBought: "Starbucks Katipunan",
    specification: "Iced Caramel Macchiato, Grande",
    instructions: "No whipped cream, paper straw only",
    placeDelivered: "Ateneo Library Lobby",
    fee: 60,
  },
];
