import { useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { config } from "../../../config";
import axios from "axios";
import { format } from 'date-fns';
import { Chip, Box, Card, Checkbox, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';

export const PaymentListResults = ({ payments}) => {
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);

  const handleSelectAll = (event) => {
    let newSelectedCustomerIds;

    if (event.target.checked) {
      newSelectedCustomerIds = payments.map((customer) => customer.id);
    } else {
      newSelectedCustomerIds = [];
    }

    setSelectedCustomerIds(newSelectedCustomerIds);
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedCustomerIds.indexOf(id);
    let newSelectedCustomerIds = [];

    if (selectedIndex === -1) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(selectedCustomerIds, id);
    } else if (selectedIndex === 0) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(selectedCustomerIds.slice(1));
    } else if (selectedIndex === selectedCustomerIds.length - 1) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(selectedCustomerIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedCustomerIds = newSelectedCustomerIds.concat(
        selectedCustomerIds.slice(0, selectedIndex),
        selectedCustomerIds.slice(selectedIndex + 1)
      );
    }

    setSelectedCustomerIds(newSelectedCustomerIds);
  };

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const cancelPayment = async (hash) => {
    await axios.post(`${config.contextRoot}/payment/${hash}/cancellation`);
  }

  const paymentStatusTag = (param) => {
    switch(param) {
      case 'CREATED':
        return <Chip label={param} color='info'/>;
      case 'PAID':
        return <Chip label={param} color='success'/>;
      case 'CANCELLED':
        return <Chip label={param} color='error'/>;
      default:
        return <Chip label={param} color='warning'/>;
    }
  };
  
  return (
    <Card>
      <PerfectScrollbar>
        <Box sx={{ minWidth: 1050 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Amount
                </TableCell>
                <TableCell>
                  Status
                </TableCell>
                <TableCell>
                  Title
                </TableCell>
                <TableCell>
                  Creation date
                </TableCell>
                <TableCell>
                  Options
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments?.slice(0, limit).map((payment) => (
                <TableRow
                  hover
                  key={payment.id}
                  selected={selectedCustomerIds.indexOf(payment.id) !== -1}
                >
                  <TableCell>
                    {`${payment.amount} - ${payment.currency}`}
                  </TableCell>
                  <TableCell>
                    {paymentStatusTag(payment.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    {`${payment.title}`}
                  </TableCell>
                  <TableCell>
                    {format(Date.parse(payment.createdAt), 'dd/MM/yyyy')} 
                  </TableCell>
                  <TableCell>
                      <IconButton color="primary" aria-label="edit" component="label"
                        onClick={() => {navigator.clipboard.writeText(payment.paymentLink)}}>
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton color="primary" aria-label="edit" component="label">
                        <ReceiptLongOutlinedIcon />
                      </IconButton>
                      {payment.paymentStatus !== "CANCELLED" && payment.paymentStatus !== "PAID" && 
                        <IconButton color="primary" aria-label="cancel" component="label"
                          onClick={() => {cancelPayment(payment.hash)}}>
                          <BlockOutlinedIcon />
                        </IconButton>
                      }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
      <TablePagination
        component="div"
        count={payments ? payments.length : 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
};


export default PaymentListResults;
