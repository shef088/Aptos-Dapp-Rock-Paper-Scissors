import { useWallet } from "@aptos-labs/wallet-adapter-react";
 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import GameInterface from "./components/GameInterface";
import { ToastContainer  } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { connected } = useWallet();

  return (
    <>
      <Header />
      <ToastContainer position="top-left" />
      <div className="flex items-center justify-center flex-col main-cont">
        {connected ? (
          <Card>
            <CardContent className="flex flex-col gap-10 pt-6">
         <GameInterface/>
            </CardContent>
          </Card>
        ) : (
          <CardHeader>
            <CardTitle>To get started Connect a wallet</CardTitle>
          </CardHeader>
        )}
      </div>
    </>
  );
}

export default App;