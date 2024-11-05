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
  Snackbar,
  Alert,
  Stack,
  TextField,
  Toolbar,
  Typography,
  Avatar,
  createTheme,
  ThemeProvider,
} from "@mui/material";

import abi from "../abi.json";
import MenuIcon from "@mui/icons-material/Menu";
import { ethers } from "ethers";
import { formatEther, parseUnits } from "@ethersproject/units";
import { initializeConnector } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import Link from "next/link";
import Swal from "sweetalert2";

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

export default function RandomPage() {
  const chainId = useChainId();
  const accounts = useAccounts();
  const isActive = useIsActive();
  const provider = useProvider();
  const [balance, setBalance] = useState("");



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

  const handleBuyMessage = async () => {
    try {
      if (!provider) {
        Swal.fire({
          title: "ข้อผิดพลาด!",
          text: "กรุณาเชื่อมต่อกระเป๋าเงินของคุณก่อน",
          icon: "error",
          confirmButtonText: "ตกลง",
        });
        return;
      }

      const signer = provider.getSigner();
      const smartContract = new ethers.Contract(contractAddress, abi, signer);

      Swal.fire({
        title: "กำลังดำเนินการ...",
        text: "กรุณายืนยันการทำรายการในกระเป๋าเงินของคุณ",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      const tx = await smartContract.buyMessage();
      console.log("Transaction hash:", tx.hash);

      Swal.fire({
        title: "ส่งรายการแล้ว",
        text: "กำลังรอการยืนยันจากเครือข่าย...",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      // รอการยืนยันโดยใช้ provider.once พร้อมตรวจสอบสถานะธุรกรรม
      provider.once(tx.hash, async (transaction) => {
        try {
          // ตรวจสอบว่าธุรกรรมสำเร็จหรือไม่
          const receipt = await provider.getTransactionReceipt(tx.hash);
          if (receipt && receipt.status === 1) {
            // ธุรกรรมสำเร็จ
            const selectedMessage = await smartContract.getLastMessage();

            Swal.fire({
              title: "สำเร็จ! 🎉",
              html: `
                          <p>บันทึกคำอวยพรของคุณลงในบล็อกเชนเรียบร้อยแล้ว</p>
                          <p class="mt-4 text-lg font-bold">${selectedMessage}</p>
                          <p class="mt-2 text-sm">
                              <a href="https://sepolia.etherscan.io/tx/${tx.hash}" 
                                 target="_blank" 
                                 class="text-blue-500 hover:text-blue-700">
                                  ดูรายการบน Etherscan
                              </a>
                          </p>
                      `,
              icon: "success",
              confirmButtonText: "ตกลง",
            });
          } else {
            // ธุรกรรมล้มเหลว
            Swal.fire({
              title: "ข้อผิดพลาด!",
              text: "การทำรายการล้มเหลว โปรดลองใหม่อีกครั้ง",
              icon: "error",
              confirmButtonText: "ตกลง",
            });
          }
        } catch (error) {
          console.error("Error checking transaction status:", error);
          Swal.fire({
            title: "ข้อผิดพลาด!",
            text: "เกิดปัญหาในการตรวจสอบสถานะของการทำรายการ โปรดลองใหม่อีกครั้ง",
            icon: "error",
            confirmButtonText: "ตกลง",
          });
        }
      });
    } catch (error) {
      console.error("Transaction error:", error);

      let errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

      if (error.code === 4001) {
        errorMessage = "คุณได้ยกเลิกการทำรายการ";
      } else if (error.code === -32603) {
        errorMessage = "ยอดเงินไม่เพียงพอสำหรับการทำรายการ";
      } else if (error.message && error.message.includes("gas")) {
        errorMessage = "การประมาณค่าแก๊สล้มเหลว รายการอาจไม่สำเร็จ";
      }

      Swal.fire({
        title: "ข้อผิดพลาด!",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    }
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

                <Link href="/">
                  <Button variant="contained" color="secondary">
                    Exchange
                  </Button>
                </Link>

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

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1" sx={{ marginTop: 2 }}>
                        LKT Coin : {balance}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 3,
                textAlign: "center",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <CardContent>
                {/* เพิ่มภาพสินค้า */}
                <Avatar
                  src="../images/blessing.png"
                  sx={{ width: 150, height: 150, margin: "0 auto", mb: 2 }} 
                />
                <Typography variant="h5" sx={{ mb: 1 }}>
                  Random Blessing Message
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  A special blessing that brings good fortune and happiness to
                  your life!
                </Typography>
                <Typography variant="h6" sx={{ mb: 2, color: "green" }}>
                  Price: 0.000001 LKT
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleBuyMessage} 
                >
                  Get Random Message
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}
