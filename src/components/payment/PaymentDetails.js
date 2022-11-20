import React from 'react'
import { Contract, ethers } from "ethers";
import * as PaymentContract from "../../abis/payment/PaymentContract.json";
import { config } from "../../config";
import axios from "axios";
import { getWalletProvider } from "../../utils/ethereumWalletProvider";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    Typography,
    IconButton, TextField, FormControl, InputLabel, Select, MenuItem,
    List, ListItem,  ListItemAvatar, ListItemText, ListItemSecondaryAction
} from '@mui/material';

const PaymentDetails = ({paymentInfo, mock, setPaymentInfo}) => {
    const pay = async () => {
        if(mock){
            return;
        }
        if(isCustomerRequiredInfo && isReadyToPay){
            await updatePaymentInfo().catch(function (error) {
                alert("error here")
                throw error;
            });
        }
        let provider, library, accounts, network, address;
        try {
          provider = await getWalletProvider().connect();
          library = new ethers.providers.Web3Provider(provider);
          accounts = await library.listAccounts();
          network = await library.getNetwork();
          console.log(network);
        } catch (error) {
          console.error(error);
        }
        if (accounts) {  
            address = accounts[0];
        
            const signer = await library.getSigner(address)
            console.log(signer);
            // TODO: Create a util class to handle smart contract operations // paymentExecution 
            const paymentContract = new Contract(
                "0x43105B041E6061A592A9763Af56447a51709932A", //TODO: move to a consts class
                PaymentContract.abi, 
                signer
              );
            console.log(paymentContract);
            console.log(paymentInfo.creditAddress);
            const transaction = await paymentContract.pay(paymentInfo.creditAddress, {value: ethers.utils.parseEther(paymentInfo.amount.toString())}); // use the amount from the paymentInfo
            console.log(`Transaction Hash: ${transaction.hash}`)
            const result = await transaction.wait();
            console.log(result);
            console.log("PAID");
            const paymentConfirmation = {
                transactionHash: transaction.hash,
                blockHash: result.blockHash,
                blockNumber: result.blockNumber,
                gasUsed: result.gasUsed.toString(),
                toAddress: result.to,
                fromAddress: result.from,
                confirmations: result.confirmations

            }
            await callPaymentConfirmation(paymentConfirmation);
            console.log("payment confirmed");
        }
    }

    const updatePaymentInfo = async () => {
        console.log(paymentInfo);
        await axios
        .patch(`${config.contextRoot}/payment/${paymentInfo.hash}`, paymentInfo)
        .then(function (response) {
          console.log(response);
          if(response.status === 200){
            console.log("Update")
          }
        }).catch(function (error) {
            console.error(error)
            throw error;
        });
    }

    const handleCustomerInfo = (event) => {
        setPaymentInfo({...paymentInfo, ["customerInfo"]: {...paymentInfo.customerInfo, [event.target.name]: event.target.value}})
    }

    const handleCustomerShippingInfo = (event) => {
        setPaymentInfo({...paymentInfo, ["customerInfo"]: {...paymentInfo.customerInfo, ["shippingAddress"]:{...paymentInfo.customerInfo.shippingAddress, [event.target.name]: event.target.value}}})
    }

    const callPaymentConfirmation = async (paymentConfirmation) => {
        await axios.post(`${config.contextRoot}/payment/${paymentInfo.hash}/confirmation`, paymentConfirmation);
    }

    const isCustomerRequiredInfo = (customerRequiredInfo) => {
        return customerRequiredInfo?.name || 
            customerRequiredInfo?.email ||
            customerRequiredInfo?.phoneNumber ||
            customerRequiredInfo?.shippingAddress;
    }

    const isReadyToPay = () => {
        if(isCustomerRequiredInfo){
            if(paymentInfo?.customerRequiredInfo?.name && isNotFilled(paymentInfo?.customerInfo?.name)){
                return false;
            }
            if(paymentInfo?.customerRequiredInfo?.email && isNotFilled(paymentInfo?.customerInfo?.email)){
                return false;
            }
            if(paymentInfo?.customerRequiredInfo?.phoneNumber && isNotFilled(paymentInfo?.customerInfo?.phoneNumber)){
                return false;
            }
            if(paymentInfo?.customerRequiredInfo?.shippingAddress 
                    && (isNotFilled(paymentInfo?.customerInfo?.shippingAddress?.country)
                    || isNotFilled(paymentInfo?.customerInfo?.shippingAddress?.address)
                    || isNotFilled(paymentInfo?.customerInfo?.shippingAddress?.city)
                    || isNotFilled(paymentInfo?.customerInfo?.shippingAddress?.zipCode)
                    || isNotFilled(paymentInfo?.customerInfo?.shippingAddress?.state))){
                return false;
            }
        }
        return true;
    }

    const isNotFilled = (field) => {
        return (field === "" || field === undefined || field === null);
    }

    const addQuantity = (product) => {
        const currentAmount = paymentInfo.amount;
        const index = paymentInfo.products.findIndex(prd => prd.item.id === product.item.id);
        paymentInfo.products[index].item.totalSupply--;
        paymentInfo.products[index].quantity++;
        setPaymentInfo({...paymentInfo, ["amount"]: Number(currentAmount) + Number(product.item.price)});
    }
    
    const removeQuantity = (product) => {
        const currentAmount = paymentInfo.amount;
        const index = paymentInfo.products.findIndex(prd => prd.item.id === product.item.id);
        paymentInfo.products[index].item.totalSupply++;
        paymentInfo.products[index].quantity--;
        const newAmount = Number(currentAmount) - Number(product.item.price);
        setPaymentInfo({...paymentInfo, ["amount"]: newAmount});
    }

    return (
        <Box
            lg={8} md={6} xs={12}
            display="block"
            justifyContent="center"
            alignItems="center"
            margin="10px"
            minHeight="10vh"
            width={`${mock ? '70%' : '100%'} `}
        >
            <Card>
                <CardHeader subheader="Amount Due" title={paymentInfo?.amount + ` ` + paymentInfo?.currency}/>
                <Divider />
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid container sx={{ flex: '1 1 auto' }}>
                        <Grid item xs={12} lg={isCustomerRequiredInfo(paymentInfo?.customerRequiredInfo)? 6 : 12} sx={{ backgroundColor: 'neutral.50', display: 'top', flexDirection: 'column', position: 'relative' }} >
                            <Grid item md={12} xs={12}>
                                <Typography sx={{ m: 1 }} color="inherit" variant="h4">
                                    {paymentInfo?.companyName}
                                </Typography>
                            </Grid>
                            <List dense={true}>
                                {paymentInfo?.products?.length > 0 && 
                                    paymentInfo?.products.map((product) => (
                                    <ListItem key={product.item.id} button>
                                        <ListItemAvatar>
                                            <Avatar
                                                alt={product.item?.name}
                                                src={`data:image/jpeg;base64,${product.item?.image}`}
                                                variant="square"
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${product.item?.name} - ${product.item?.price} ${product.item?.token}`}
                                            secondary={`${product.quantity}x`}
                                        />
                                        {paymentInfo?.adjustableQuantity && 
                                            <ListItemSecondaryAction>
                                                <IconButton disabled={product.item?.totalSupply === 0} aria-label="plus" onClick={() => addQuantity(product)}>
                                                    <AddRoundedIcon  />
                                                </IconButton>
                                                <IconButton disabled={product.quantity === 1} aria-label="minus"  onClick={() => removeQuantity(product)}>
                                                    <RemoveRoundedIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        }
                                    </ListItem>
                                    
                                            
                                ))}
                            </List>
                            <Divider/>
                            {paymentInfo?.amount &&
                                <Grid item xs={12} lg={12}  >              
                                    <Typography sx={{ mt: 3, ml: '40%' }} variant="h6">
                                        Total due: {paymentInfo?.amount} {paymentInfo?.currency}
                                    </Typography>
                                </Grid>
                            }
                        </Grid>
                        {isCustomerRequiredInfo(paymentInfo?.customerRequiredInfo) && 
                        <Grid item xs={12} lg={6} sx={{ backgroundColor: 'neutral.50', display: 'top', flexDirection: 'column', position: 'relative' }} >
                            {(paymentInfo?.customerRequiredInfo.name || paymentInfo?.customerRequiredInfo.email || paymentInfo?.customerRequiredInfo.phoneNumber) &&
                                <Grid container sx={{ m: 1 }}>  
                                    <Grid item xs={12} lg={12}>              
                                    <Typography sx={{ m: 1 }} variant="h6">
                                        Contact Information
                                    </Typography>
                                    </Grid>
                                    {paymentInfo?.customerRequiredInfo.name && 
                                        <Grid xs={12} lg={12} item sx={{ m: 0.3 }}>   
                                            <FormControl  fullWidth>
                                                <TextField
                                                    id="outlined-number"
                                                    label="Name"
                                                    name="name"
                                                    type="text"
                                                    value={paymentInfo?.customerInfo?.name || ''}
                                                    onChange={handleCustomerInfo}
                                                />
                                            </FormControl>
                                        </Grid>
                                    }
                                    {paymentInfo?.customerRequiredInfo.email &&  
                                        <Grid xs={12} lg={12} item sx={{ m: 0.3 }}>   
                                            <FormControl  fullWidth>
                                                <TextField
                                                    id="outlined-number"
                                                    label="Email"
                                                    name="email"
                                                    type="text"
                                                    value={paymentInfo?.customerInfo?.email || ''}
                                                    onChange={handleCustomerInfo}
                                                />
                                            </FormControl>
                                        </Grid>
                                    }
                                    {paymentInfo?.customerRequiredInfo.phoneNumber &&  
                                        <Grid xs={12} lg={12} item sx={{ m: 0.3 }}>   
                                            <FormControl  fullWidth>
                                                <TextField
                                                    id="outlined-number"
                                                    label="Phone number"
                                                    type="text"
                                                    name="phoneNumber"
                                                    value={paymentInfo?.customerInfo?.phoneNumber || ''}
                                                    onChange={handleCustomerInfo}
                                                />
                                            </FormControl>
                                        </Grid>
                                    }
                                </Grid>
                            }
                            {paymentInfo?.customerRequiredInfo.shippingAddress &&
                                <Grid container sx={{ m: 1 }}>  
                                    <Grid item xs={12} lg={12}>              
                                        <Typography sx={{ m: 1 }} variant="h6">
                                            Shipping Address
                                        </Typography>
                                    </Grid>
                                    <Grid  item lg={12} sx={{ m: 0.3 }}>    
                                        <FormControl fullWidth >
                                            <InputLabel id="select-country-code">Select Country</InputLabel>
                                                <Select
                                                    labelId="select-country-code"
                                                    id="select-country-code"
                                                    name="country"
                                                    label="Country"
                                                    value={paymentInfo?.customerInfo?.shippingAddress?.country || ''}
                                                    onChange={handleCustomerShippingInfo}
                                                >
                                                    {/* {wallets?.map((wallet) => ( */}
                                                    <MenuItem key={1} value={"portugal"}>Portugal</MenuItem>
                                                    {/* ))} */}
                                                </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid xs={12} lg={12} item sx={{ m: 0.3 }}>   
                                        <FormControl fullWidth >
                                        <TextField
                                            id="outlined-number"
                                            label="Address Line 1"
                                            type="text"
                                            name="address"
                                            value={paymentInfo?.customerInfo?.shippingAddress?.address || ''}
                                            onChange={handleCustomerShippingInfo}
                                        />
                                        </FormControl>
                                    </Grid>
                                    <Grid item sx={{ m: 0.3 }}>
                                        <TextField
                                            id="outlined-number"
                                            label="City"
                                            type="text"
                                            name="city"
                                            value={paymentInfo?.customerInfo?.shippingAddress?.city || ''}
                                            onChange={handleCustomerShippingInfo}
                                        />
                                    </Grid>
                                    <Grid item sx={{ m: 0.3 }}>
                                        <TextField
                                            id="outlined-number"
                                            label="Zip code"
                                            type="text"
                                            name="zipCode"
                                            value={paymentInfo?.customerInfo?.shippingAddress?.zipCode || ''}
                                            onChange={handleCustomerShippingInfo}
                                        />
                                    </Grid>
                                    <Grid item sx={{ m: 0.3 }}>
                                        <TextField
                                            id="outlined-number"
                                            label="State"
                                            type="text"
                                            name="state"
                                            value={paymentInfo?.customerInfo?.shippingAddress?.state || ''}
                                            onChange={handleCustomerShippingInfo}
                                        />
                                    </Grid>
                                </Grid>
                            }
                        </Grid> 
                        }
                    </Grid>     
                    </Grid>
                    <Typography sx={{m: 3}} color="textSecondary" variant="body2" >
                        Powered by CrossPay | Tems Privacy
                    </Typography>
                </CardContent>
                <Divider />
                <Box sx={{ display: 'center', justifyContent: 'center', p: 2 }}>
                    <Button color="primary" variant="contained" onClick={pay} disabled={!isReadyToPay()}>
                        Pay {paymentInfo?.amount} {paymentInfo?.currency}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}

export default PaymentDetails;