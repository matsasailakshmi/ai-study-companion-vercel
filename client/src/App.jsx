import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Spaces from "./pages/Spaces";
import Projects from "./pages/Projects";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Progress from "./pages/Progress";
import Assessments from "./pages/Assessments";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Main application */}
        <Route path="/home" element={<Home />} />
        <Route path="/spaces" element={<Spaces />} />
        <Route path="/spaces/:spaceId" element={<Projects />} />

        {/* Project */}
        <Route path="/projects/:projectId" element={<ProjectWorkspace />} />

        {/* Global Progress */}
        <Route path="/progress" element={<Progress />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
