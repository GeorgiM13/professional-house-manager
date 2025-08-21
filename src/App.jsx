import { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"


import Home from "./Home"
import ForUs from "./ForUs"
import Documents from "./Documents"
import Contacts from "./Contacts"
import Login from "./Login"
import "./App.css"

import PrivateRoute from "./components/PrivateRoute"

import AdminLayout from "./admin/AdminLayout"

import AdminEvents from "./admin/AdminEvents"
import AdminBuildingCash from "./admin/AdminBuildingCash"
import AdminContactForms from "./admin/AdminContactForms"
import AdminExpenses from "./admin/AdminExpenses"
import AdminFees from "./admin/AdminFees"
import AdminReports from "./admin/AdminReports"

import AddEvent from "./admin/subpages/AddEvent"
import EventDetails from "./admin/subpages/EventDetails"
import EditEvent from "./admin/subpages/EditEvent"
import ReportDetails from "./admin/subpages/ReportDetails"
import EditReport from "./admin/subpages/EditReport"
import AddExpense from "./admin/subpages/AddExpense"
import EditExpense from "./admin/subpages/EditExpense"
import FormDetails from "./admin/subpages/FormDetails"

import UserEvents from "./client/UserEvents"
import UserLayout from "./client/UserLayout"
import UserReports from "./client/UserReports"
import UserFees from "./client/UserFees"
import UserExpenses from "./client/UserExpenses"
import UserBuildingCash from "./client/UserBuildingCash"

import UserEventDetails from "./client/subpages/EventDetails"
import UserAddReport from "./client/subpages/AddReport"
import UserReportDetails from "./client/subpages/ReportDetails"
import UserExpensesDetails from "./client/subpages/ExpensesDetails"

import EditProfile from "./EditProfile"




function App() {

    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <Router>
            <div className="app-container">
                
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/for-us" element={<ForUs />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/login" element={<Login />} />    
                        <Route path="/admin/*" element={
                        <PrivateRoute allowedRoles={['admin']} userRole={user?.role}>
                            <AdminLayout />
                        </PrivateRoute>
                        }>
                            <Route path="adminevents" element={<AdminEvents />} />
                            <Route path="addevent" element={<AddEvent />} />
                            <Route path="event/:id" element={<EventDetails />} />
                            <Route path="editevent/:id" element={<EditEvent />} />
                            <Route path="reports" element={<AdminReports />} />
                            <Route path="report/:id" element={<ReportDetails />} />
                            <Route path="editreport/:id" element={<EditReport />} />
                            <Route path="contactforms" element={<AdminContactForms />} />
                            <Route path="message/:id" element={<FormDetails />}/>
                            <Route path="fees" element={<AdminFees />} />
                            <Route path="expenses" element={<AdminExpenses />} />
                            <Route path="addexpense" element={<AddExpense />} />
                            <Route path="editexpense/:id" element={<EditExpense />} />
                            <Route path="buildingcash" element={<AdminBuildingCash />} />
                            <Route path="profile/change" element={<EditProfile />} />
                        </Route>

                        <Route path="/client/*" element={
                            <PrivateRoute allowedRoles={['user']} userRole={user?.role}>
                            <UserLayout />
                        </PrivateRoute>
                        }>
                            <Route path="userevents" element={<UserEvents />} />
                            <Route path="event/:id" element={<UserEventDetails />} />
                            <Route path="reports" element={<UserReports />} />
                            <Route path="addreport" element={<UserAddReport />} />
                            <Route path="report/:id" element={<UserReportDetails />} />
                            <Route path="fees" element={<UserFees />} />
                            <Route path="expenses" element={<UserExpenses />} />
                            <Route path="expense/:id" element={<UserExpensesDetails />} />
                            <Route path="buildingCash" element={<UserBuildingCash />} />
                            <Route path="profile/change" element={<EditProfile />} />
                        </Route>
                    </Routes>
                </main>
                
            </div>
        </Router>
    );
}

export default App;
