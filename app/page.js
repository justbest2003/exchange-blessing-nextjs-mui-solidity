"use client";
import React, { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
  Avatar,
  createTheme,
  ThemeProvider,
} from "@mui/material";

import abi from "./abi.json";
import MenuIcon from "@mui/icons-material/Menu";
import { ethers } from "ethers";
import { formatEther, parseUnits } from "@ethersproject/units";
import { initializeConnector } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import Link from "next/link";
//import { useRouter } from "next/navigation";

const [metaMask, hooks] = initializeConnector(
  (actions) => new MetaMask({ actions })
);
const { useChainId, useAccounts, useIsActive, useProvider } = hooks;
const contractChain = 11155111;
const contractAddress = "0x512C152C6cF44B2FF165c8017128988E0ca8BbD1";

const getAddressTxt = (str, s = 6, e = 6) => {
  if (str) {
    return `${str.slice(0, s)}...${str.slice(str.length - e)}`;
  }
  return "";
};

export default function Page() {
  //const router = useRouter()
  const chainId = useChainId();
  const accounts = useAccounts();
  const isActive = useIsActive();
  const provider = useProvider();
  const [balance, setBalance] = useState("");
  const [ETHValue, setETHValue] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      const signer = provider.getSigner();
      const smartContract = new ethers.Contract(contractAddress, abi, signer);
      const myBalance = await smartContract.balanceOf(accounts[0]);
      setBalance(formatEther(myBalance));
    };
    if (isActive) {
      fetchBalance();
    }
  }, [isActive]);

  const handleBuy = async () => {
    if (ETHValue <= 0) return;
    const signer = provider.getSigner();
    const smartContract = new ethers.Contract(contractAddress, abi, signer);
    const weiValue = parseUnits(ETHValue.toString(), "ether");
    const tx = await smartContract.buy({ value: weiValue.toString() });
    console.log("Transaction hash:", tx.hash);
  };

  useEffect(() => {
    void metaMask.connectEagerly().catch(() => {
      console.debug("Failed to connect eagerly to MetaMask");
    });
  }, []);

  const handleConnect = () => metaMask.activate(contractChain);
  const handleDisconnect = () => {
    metaMask.resetState();
    alert(
      "To fully disconnect, please remove this site from MetaMask's connected sites by locking MetaMask."
    );
  };

  const theme = createTheme({
    palette: {
      primary: { main: "#433878" },
      secondary: { main: "#7E60BF" },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Random Blessing Message
            </Typography>

            {!isActive ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleConnect}
              >
                CONNECT WALLET
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Chip
                  label={getAddressTxt(accounts[0])}
                  variant="outlined"
                  color="inherit"
                  sx={{ color: "white", borderColor: "white" }}
                />

                <Link href="/random">
                <Button variant="contained" color="secondary">
                  Random Blessing
                </Button>
              </Link>
                {/* <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => router.push("/random")}
                >
                  Random Blessing
                </Button> */}

                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleDisconnect}
                >
                  DISCONNECT WALLET
                </Button>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 2 }}>
        {isActive && (
          <>
            {/* User Profile Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    src="/images/avatar.png"
                    sx={{ bgcolor: "primary.main", width: 56, height: 56 }}
                  >
                    {accounts[0]?.slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      User Profile
                    </Typography>
                    <Typography variant="body1">
                      Status :{" "}
                      <span style={{ color: isActive ? "green" : "red" }}>
                        {isActive ? "Connected" : "Disconnected"}
                      </span>
                    </Typography>

                    <Typography variant="body1">
                      LKT Coin : {balance}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* UDS Balance and Purchase */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">LuckyCoin Balance</Typography>
                  <TextField
                    label="Address"
                    value={getAddressTxt(accounts[0])}
                    InputProps={{ readOnly: true }}
                  />
                  <TextField
                    label="LKT Coin Balance"
                    value={balance}
                    InputProps={{ readOnly: true }}
                  />
                  <Divider />
                  <Typography>Buy LKT (1 ETH = 10 LKT)</Typography>
                  <TextField
                    label="ETH"
                    type="number"
                    onChange={(e) => setETHValue(parseFloat(e.target.value))}
                    value={ETHValue}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleBuy}
                  >
                    Buy
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}
