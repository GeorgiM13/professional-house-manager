import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ThemeProvider } from "./components/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";


const Home = lazy(() => import("./Home"));
const ForUs = lazy(() => import("./ForUs"));
const Documents = lazy(() => import("./Documents"));
const Contacts = lazy(() => import("./Contacts"));
const Login = lazy(() => import("./Login"));
const EmailConfirm = lazy(() => import("./EmailConfirm"));

const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const UserLayout = lazy(() => import("./client/UserLayout"));

const AdminEvents = lazy(() => import("./admin/AdminEvents"));
const AdminBuildingCash = lazy(() => import("./admin/AdminBuildingCash"));
const AdminContactForms = lazy(() => import("./admin/AdminContactForms"));
const AdminExpenses = lazy(() => import("./admin/AdminExpenses"));
const AdminFees = lazy(() => import("./admin/AdminFees"));
const AdminReports = lazy(() => import("./admin/AdminReports"));

const AddEvent = lazy(() => import("./admin/subpages/AddEvent"));
const EventDetails = lazy(() => import("./admin/subpages/EventDetails"));
const EditEvent = lazy(() => import("./admin/subpages/EditEvent"));
const ReportDetails = lazy(() => import("./admin/subpages/ReportDetails"));
const EditReport = lazy(() => import("./admin/subpages/EditReport"));

const AddExpense = lazy(() => import("./admin/subpages/AddExpense"));
const EditExpense = lazy(() => import("./admin/subpages/EditExpense"));
const FormDetails = lazy(() => import("./admin/subpages/FormDetails"));

const EditGlobalUser = lazy(() => import("./admin/subpages/EditGlobalUser"));
const EditProfile = lazy(() => import("./EditProfile"));

const Buildings = lazy(() => import("./admin/subpages/Buildings"));
const AddBuilding = lazy(() => import("./admin/subpages/AddBuilding"));
const EditBuilding = lazy(() => import("./admin/subpages/EditBuilding"));

const Users = lazy(() => import("./admin/subpages/GlobalUsers"));
const BuildingUsers = lazy(() => import("./admin/subpages/BuildingUsers"));
const AddUser = lazy(() => import("./admin/subpages/AddUser"));
const EditUser = lazy(() => import("./admin/subpages/EditBuildingUser"));
const AddUserToBuilding = lazy(() => import("./admin/subpages/AddUserToBuilding"));

const UserEvents = lazy(() => import("./client/UserEvents"));
const UserReports = lazy(() => import("./client/UserReports"));
const UserFees = lazy(() => import("./client/UserFees"));
const UserExpenses = lazy(() => import("./client/UserExpenses"));
const UserBuildingCash = lazy(() => import("./client/UserBuildingCash"));

const UserEventDetails = lazy(() => import("./client/subpages/EventDetails"));
const UserAddReport = lazy(() => import("./client/subpages/AddReport"));
const UserReportDetails = lazy(() => import("./client/subpages/ReportDetails"));
const UserExpensesDetails = lazy(() => import("./client/subpages/ExpensesDetails"));


const LoadingScreen = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    color: '#888' 
  }}>
    Зареждане...
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          <main className="main-content">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/for-us" element={<ForUs />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/login" element={<Login />} />
                <Route path="/confirm-email" element={<EmailConfirm />} />

                <Route element={<ProtectedRoute requiredRole="admin" />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route path="adminevents" element={<AdminEvents />} />
                    <Route path="addevent" element={<AddEvent />} />
                    <Route path="event/:id" element={<EventDetails />} />
                    <Route path="editevent/:id" element={<EditEvent />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="report/:id" element={<ReportDetails />} />
                    <Route path="editreport/:id" element={<EditReport />} />
                    <Route path="contactforms" element={<AdminContactForms />} />
                    <Route path="message/:id" element={<FormDetails />} />
                    <Route path="fees" element={<AdminFees />} />
                    <Route path="expenses" element={<AdminExpenses />} />
                    <Route path="addexpense" element={<AddExpense />} />
                    <Route path="editexpense/:id" element={<EditExpense />} />
                    <Route path="buildingcash" element={<AdminBuildingCash />} />
                    <Route path="profile/change" element={<EditProfile />} />
                    <Route path="buildings" element={<Buildings />} />
                    <Route path="addbuilding" element={<AddBuilding />} />
                    <Route path="buildings/:id/edit" element={<EditBuilding />} />
                    <Route path="users" element={<Users />} />
                    <Route path="/admin/users-building" element={<BuildingUsers />} />
                    <Route path="add-user" element={<AddUser />} />
                    <Route path="edit-user/:id" element={<EditUser />} />
                    <Route path="/admin/edit-global-user/:id" element={<EditGlobalUser />} />
                    <Route
                      path="add-user-to-building"
                      element={<AddUserToBuilding />}
                    />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute requiredRole="user" />}>
                  <Route path="/client" element={<UserLayout />}>
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
                </Route>
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;