import { useAuth } from "../auth/AuthProvider";
import AdminHomepage from "./homepage/AdminHomepage";
import Homepage from "./homepage/Homepage";
import PublicHomepage from "./homepage/PublicHomepage";

import { PageLoader } from "../components/SkeletonLoader";


export default function Home(){
  const { user, loading } = useAuth();

  if(loading) {
    return <PageLoader />;
    // return <Spinner />
  }

  if(!user) {
    return <PublicHomepage />;
  }
  if(user.role === "admin") {
    // return <p>Admin homepage (da implementare)</p>;
    return <AdminHomepage />;
  }
  // return <p>Homepage utente (da implementare)</p>;
  return <Homepage />;

}