import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookingHistory from "./pages/BookingHistory";
import Membership from "./pages/Membership";
import Profile from "./pages/Profile";
import Movies from "./pages/Movies";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/movies/:id",
    Component: MovieDetail,
  },
  {
    path: "/seats/:movieId/:showtimeId",
    Component: SeatSelection,
  },
  {
    path: "/checkout",
    Component: Checkout,
  },
  {
    path: "/confirmation",
    Component: Confirmation,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/booking-history",
    Component: BookingHistory,
  },
  {
    path: "/membership",
    Component: Membership,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/movies",
    Component: Movies,
  }
]);
