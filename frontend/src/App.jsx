import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./AuthModule/Login";
import Dashboard from "./Dashboard";
import Properties from "./Properties";
import Units from "./Units";
import Tenants from "./Tenants";
import Contracts from "./Contracts";
import Payments from "./Payments";
import AddUser from './AddUser';
import Expenses from './Expenses';
import Revenues from "./revenues";



function App() {
 const routes = createBrowserRouter([
    {
      path: "/",
      element: <Login />,
    },
    {
      path: "/dashboard",
      element: <Dashboard/>,
    },
    {
      path: "/properties",
      element: <Properties/>,
    },
    {
      path: "/units",
      element: <Units/>,
    },
    {
      path: "/tenants",
      element: <Tenants/>,
    },
    {
      path: "/contracts",
      element: <Contracts/>,
    },
    {
      path: "/payments",
      element: <Payments/>
    },
    {
      path: "/users/add",
      element: <AddUser/>
    },
    {
      path: "/expenses",
      element: <Expenses/>
    },
    {
      path: "/revenues",
      element: <Revenues/>
    }
  ]);

  return (
    <>
      <RouterProvider router={routes} />
    </>
  )
}

export default App
