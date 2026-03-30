import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import React, { useCallback, useEffect, useState } from "react";
import { Grow } from "@mui/material";
import useBarraAlerta, { SnackBarItemType } from "./useBarraAlerta";

export const BarraAlertaProvider = () => {
  const { items } = useBarraAlerta();

  return (
    <Snackbar open anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      <div>
        {items && items.map((item) => <Alert key={item.key} item={item} />)}
      </div>
    </Snackbar>
  );
};

const Alert = ({ item }: { item: SnackBarItemType }) => {
  const [open, setOpen] = useState(true);
  const { removeSnackBar } = useBarraAlerta();

  const handleClose = useCallback(() => {
    setOpen(false);
    removeSnackBar(item.key!);
  }, [setOpen, removeSnackBar, item.key]);

  useEffect(() => {
    if (item.color === "error") return;

    setTimeout(() => {
      handleClose();
    }, item.autoHideDuration || 8000);
  }, [handleClose, item.autoHideDuration, item.color]);

  return (
    <Grow key={item.key} timeout={500} in={open}>
      <MuiAlert
        onClose={handleClose}
        severity={item.color}
        sx={{ boxShadow: "0px 0px 3px #b2b2b2" }}
      >
        {item.text}
      </MuiAlert>
    </Grow>
  );
};
