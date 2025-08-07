import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Schools from "@/pages/schools";
import SchoolDetail from "@/pages/SchoolDetail";
import Culture from "@/pages/culture";
import Music from "@/pages/culture/Music";
import FineArts from "@/pages/culture/FineArts";
import Dance from "@/pages/culture/Dance";
import Drama from "@/pages/culture/Drama";
import Poems from "@/pages/culture/Poems";
import DanceDramaPoems from "@/pages/culture/DanceDramaPoems";
import Books from "@/pages/books";
import BooksStore from "@/pages/BooksStore";
import Community from "@/pages/Community";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import UserDashboard from "@/pages/UserDashboard";
import BookPublication from "@/pages/BookPublication";
import AdminDashboard from "@/pages/AdminDashboard";
import SchoolFeePayment from "@/pages/SchoolFeePayment";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/schools" component={Schools} />
          <Route path="/schools/:id" component={SchoolDetail} />
          <Route path="/culture" component={Culture} />
          <Route path="/culture/music" component={Music} />
          <Route path="/culture/fine-arts" component={FineArts} />
          <Route path="/culture/dance" component={Dance} />
          <Route path="/culture/drama" component={Drama} />
          <Route path="/culture/poems" component={Poems} />
          <Route path="/culture/dance-drama-poems" component={DanceDramaPoems} />
          <Route path="/books" component={Books} />
          <Route path="/books/:id" component={Books} />
          <Route path="/books-store" component={BooksStore} />
          <Route path="/community" component={Community} />
          <Route path="/user-dashboard" component={UserDashboard} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/role-admin" component={AdminDashboard} />
          <Route path="/publish" component={BookPublication} />
          <Route path="/schools/:schoolId/fee-payment" component={SchoolFeePayment} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
