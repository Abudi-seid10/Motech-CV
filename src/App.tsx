import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import PublicCV from "@/pages/PublicCV";
import CardView from "@/pages/CardView";
import Edit from "@/pages/Edit";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/card/:slug" element={<CardView />} />
        <Route path="/:slug/edit" element={<Edit />} />
        <Route path="/:slug" element={<PublicCV />} />
      </Routes>
    </BrowserRouter>
  );
}
