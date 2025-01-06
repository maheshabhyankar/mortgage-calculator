"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MortgageCalculator = () => {
  // Utility functions
  const formatNumberInput = (value) => {
    if (!value && value !== 0) return '';
    
    // Convert value to string and split into integer and decimal parts
    const [integer, decimal] = value.toString().split('.');
  
    // Match the first group of 3 digits from the end, followed by groups of 2 digits
    const formattedInteger = integer.replace(
      /(\d)(?=(\d{3})+(?!\d))/g, '$1,'
    ).replace(
      /(\d+),(\d{2},)/, '$1,$2'
    );
  
    // Return formatted integer with decimals if any
    return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
  };
  

  const parseNumberInput = (value) => {
    if (!value) return 0;
    return parseInt(value.toString().replace(/,/g, ''), 10); // Ensure proper parsing.
  };
  

  const formatIndianCurrency = (amount) => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Basic loan details
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);

  // Additional payments
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [prepaymentMonth, setPrepaymentMonth] = useState(12);
  const [prepaymentMode, setPrepaymentMode] = useState('reduce_duration');

  // Property details
  const [totalPropertyCost, setTotalPropertyCost] = useState(6000000);
  const [downPayment, setDownPayment] = useState(1200000);
  const [purchaseDate, setPurchaseDate] = useState('2023-04-01');
  const [stampDuty, setStampDuty] = useState(5);
  const [brokerFee, setBrokerFee] = useState(1);
  const [otherCharges, setOtherCharges] = useState(100000);

  // Rental yield
  const [monthlyRent, setMonthlyRent] = useState(25000);
  const [maintenanceCharges, setMaintenanceCharges] = useState(3000);

  // Appreciation
  const [annualAppreciation, setAnnualAppreciation] = useState(5);
  const [holdingPeriod, setHoldingPeriod] = useState(5);

  // Total income for tax calculation
  const [totalIncome, setTotalIncome] = useState(2000000);
  // Cost Inflation Index (CII) data - Historical values
  const CII = {
    "2023-24": 331,
    "2022-23": 317,
    "2021-22": 317,
    "2020-21": 301,
    "2019-20": 289,
    "2018-19": 280,
    "2017-18": 272,
    "2016-17": 264,
    "2015-16": 254,
    "2014-15": 240,
    "2013-14": 220,
    "2012-13": 200,
    "2011-12": 184,
    "2010-11": 167,
    "2009-10": 148,
    "2008-09": 137,
    "2007-08": 129,
    "2006-07": 122,
    "2005-06": 117,
    "2004-05": 113,
    "2003-04": 109,
    "2002-03": 105,
    "2001-02": 100,
  };

  // Helper function to get financial year from date
  const getFinancialYear = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();

    if (month <= 2) {
      return `${year - 1}-${year.toString().slice(2)}`;
    }
    return `${year}-${(year + 1).toString().slice(2)}`;
  };

  // Helper function to get latest CII
  const getLatestCII = () => {
    const years = Object.keys(CII).sort().reverse();
    return CII[years[0]];
  };

  // Helper function to get CII for a specific date
  const getCIIForDate = (dateStr) => {
    const fy = getFinancialYear(dateStr);
    return CII[fy] || getLatestCII();
  };

  // Calculate EMI
  const calculateEMI = (principal, rate, tenure) => {
    const p = parseNumberInput(principal);
    const monthlyRate = rate / 12 / 100;
    const numberOfPayments = tenure * 12;
    const emi =
      (p * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return emi;
  };

  // Calculate loan schedule with prepayment
  const calculateLoanSchedule = () => {
    let balance = parseNumberInput(loanAmount);
    let schedule = [];
    const monthlyRate = interestRate / 12 / 100;
    let currentEMI = calculateEMI(loanAmount, interestRate, loanTenure);

    for (let month = 1; month <= loanTenure * 12; month++) {
      const interest = balance * monthlyRate;
      let principal = currentEMI - interest;

      if (month === prepaymentMonth && prepaymentAmount) {
        principal += parseNumberInput(prepaymentAmount);

        if (prepaymentMode === 'reduce_emi') {
          const remainingMonths = loanTenure * 12 - month;
          const newBalance = balance - principal;
          currentEMI = calculateEMI(newBalance, interestRate, remainingMonths / 12);
        }
      }

      balance = Math.max(0, balance - principal);

      schedule.push({
        month,
        emi: currentEMI,
        principal,
        interest,
        balance,
        totalPayment: principal + interest,
      });

      if (balance === 0) break;
    }

    return schedule;
  };

  // Calculate total cost including all fees
  const calculateTotalCost = () => {
    const propCost = parseNumberInput(totalPropertyCost);
    const stampDutyAmount = (propCost * stampDuty) / 100;
    const brokerFeeAmount = (propCost * brokerFee) / 100;
    return propCost + stampDutyAmount + brokerFeeAmount + otherCharges;
  };

  // Calculate rental yield
  const calculateRentalYield = () => {
    const annualRent = (monthlyRent - maintenanceCharges) * 12;
    return (annualRent / parseNumberInput(totalPropertyCost)) * 100;
  };

  // Calculate appreciation value
  const calculateAppreciationValue = () => {
    return (
      parseNumberInput(totalPropertyCost) *
      Math.pow(1 + annualAppreciation / 100, holdingPeriod)
    );
  };

  // Calculate surcharge rate
  const calculateSurchargeRate = (income) => {
    if (income > 50000000) return 0.37;
    if (income > 20000000) return 0.25;
    if (income > 10000000) return 0.15;
    if (income > 5000000) return 0.1;
    return 0;
  };

  // Calculate capital gains tax with indexation and surcharge
  const calculateCapitalGainsTax = () => {
    const futureValue = calculateAppreciationValue();
    const currentDate = new Date();
    const purchaseFY = getFinancialYear(purchaseDate);
    const currentFY = getFinancialYear(currentDate.toISOString());

    let taxAmount = 0;
    let gains = 0;
    let indexationMultiplier = 1;
    const propCost = parseNumberInput(totalPropertyCost);

    if (holdingPeriod > 2) {
      // Long Term Capital Gains (LTCG)
      const purchaseCII = getCIIForDate(purchaseDate);
      
      // Project future CII based on historical average annual increase (approximately 5%)
      const averageAnnualCIIIncrease = 0.043; // 5% annual increase
      const projectedSaleCII = purchaseCII * Math.pow(1 + averageAnnualCIIIncrease, holdingPeriod);
      
      indexationMultiplier = projectedSaleCII / purchaseCII;
      
      const indexedCost = propCost * indexationMultiplier;
      gains = futureValue - indexedCost;
      taxAmount = Math.max(0, gains * 0.2);
    } else {
      // Short Term Capital Gains (STCG)
      gains = futureValue - propCost;
      taxAmount = Math.max(0, gains * 0.3);
    }

    const totalIncomeWithGains = parseNumberInput(totalIncome) + gains;
    const surchargeRate = calculateSurchargeRate(totalIncomeWithGains);
    const surcharge = taxAmount * surchargeRate;
    const cess = (taxAmount + surcharge) * 0.04;

    return {
      gains,
      indexationMultiplier: indexationMultiplier.toFixed(4),
      purchaseFY,
      currentFY,
      baseTax: taxAmount,
      surcharge,
      cess,
      total: taxAmount + surcharge + cess,
    };
  };

  const loanSchedule = calculateLoanSchedule();
  const totalCost = calculateTotalCost();
  const rentalYield = calculateRentalYield();
  const appreciationValue = calculateAppreciationValue();
  const taxDetails = calculateCapitalGainsTax();

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Comprehensive Mortgage Analysis</h1>

      <Tabs defaultValue="emi" className="w-full">
        <TabsList>
          <TabsTrigger value="emi">EMI Calculator</TabsTrigger>
          <TabsTrigger value="prepayment">Prepayment Analysis</TabsTrigger>
          <TabsTrigger value="costs">Total Costs</TabsTrigger>
          <TabsTrigger value="investment">Investment Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="emi">
          <Card>
            <CardHeader>
              <CardTitle>Basic EMI Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loan Amount</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formatNumberInput(loanAmount)}
                      onChange={(e) => {
                        const newValue = e.target.value.replace(/[^0-9]/g, '');
                        if (newValue) {
                          const numValue = Number(newValue);
                          if (
                            numValue >
                            parseNumberInput(totalPropertyCost) -
                              parseNumberInput(downPayment)
                          ) {
                            alert(
                              'Loan amount cannot exceed (Property Cost - Down Payment)'
                            );
                            setLoanAmount(
                              parseNumberInput(totalPropertyCost) -
                                parseNumberInput(downPayment)
                            );
                          } else {
                            setLoanAmount(numValue);
                          }
                        } else {
                          setLoanAmount('');
                        }
                      }}
                      className="pl-8"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatIndianCurrency(parseNumberInput(loanAmount))} ({
                      (
                        (parseNumberInput(loanAmount) /
                          parseNumberInput(totalPropertyCost)) *
                        100
                      ).toFixed(1)}
                    % of property value)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Interest Rate</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={interestRate}
                      min="1"
                      max="30"
                      step="0.1"
                      onChange={(e) =>
                        setInterestRate(
                          Math.min(30, Math.max(1, Number(e.target.value)))
                        )
                      }
                      className="pr-6"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Loan Tenure</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={loanTenure}
                      min="1"
                      max="30"
                      onChange={(e) =>
                        setLoanTenure(
                          Math.min(30, Math.max(1, Number(e.target.value)))
                        )
                      }
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-gray-500">Years</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold">
                  Monthly EMI:{' '}
                  {formatIndianCurrency(
                    calculateEMI(loanAmount, interestRate, loanTenure)
                  )}
                </h3>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loanSchedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) => formatIndianCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value) => formatIndianCurrency(value)}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#8884d8"
                      name="Outstanding Balance"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalPayment"
                      stroke="#82ca9d"
                      name="Monthly Payment"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prepayment">
          <Card>
            <CardHeader>
              <CardTitle>Prepayment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prepayment Amount (₹)</Label>
                  <Input
                    type="text"
                    value={formatNumberInput(prepaymentAmount)}
                    onChange={(e) => setPrepaymentAmount(parseNumberInput(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prepayment Month</Label>
                  <Input
                    type="number"
                    value={prepaymentMonth}
                    onChange={(e) => setPrepaymentMonth(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prepayment Mode</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="reduce_duration"
                      checked={prepaymentMode === 'reduce_duration'}
                      onChange={(e) => setPrepaymentMode(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span>Reduce Loan Duration</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="reduce_emi"
                      checked={prepaymentMode === 'reduce_emi'}
                      onChange={(e) => setPrepaymentMode(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span>Reduce EMI Amount</span>
                  </label>
                </div>
              </div>
            
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold">
                New Loan Duration: {Math.ceil(loanSchedule.length / 12)} years {loanSchedule.length % 12} months
              </h3>
              <h3 className="text-lg font-semibold">
                New EMI Amount: ₹{loanSchedule[loanSchedule.length - 1].emi.toFixed(2)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Total Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Property Cost (₹)</Label>
                <Input 
                  type="text" 
                  value={formatNumberInput(totalPropertyCost)}
                  onChange={(e) => {
                    const newValue = parseNumberInput(e.target.value);
                    if (newValue > 0) {
                      setTotalPropertyCost(newValue);
                    } else if (e.target.value === '') {
                      setTotalPropertyCost('');
                    } else {
                      alert('Please enter a valid number greater than zero.');
                    }
                  }}
                />

              </div>
                <div className="space-y-2">
                  <Label>Stamp Duty (%)</Label>
                  <Input 
                    type="number" 
                    value={stampDuty}
                    onChange={(e) => setStampDuty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Broker Fee (%)</Label>
                  <Input 
                    type="number" 
                    value={brokerFee}
                    onChange={(e) => setBrokerFee(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other Charges (₹)</Label>
                  <Input 
                    type="number" 
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Total Cost: ₹{totalCost.toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment">
          <Card>
            <CardHeader>
              <CardTitle>Investment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Property Cost (₹)</Label>
                  <Input 
                      type="text" 
                      value={formatNumberInput(totalPropertyCost)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, ''); // Remove commas for raw value
                        if (/^\d*$/.test(rawValue)) { // Ensure only numeric input
                          const parsedValue = parseInt(rawValue, 10);
                          if (!isNaN(parsedValue) && parsedValue > 0) {
                            setTotalPropertyCost(parsedValue);
                          } else {
                            setTotalPropertyCost(''); // Handle empty or invalid input
                          }
                        } else {
                          alert('Please enter numeric values only.');
                        }
                      }}
                    />

                  </div>
                <div className="space-y-2">
                  <Label>Down Payment (₹)</Label>
                  <Input 
                  type="text" 
                  value={formatNumberInput(downPayment)}
                  onChange={(e) => {
                    const newValue = parseNumberInput(e.target.value);
                    if (newValue > 0 && newValue <= totalPropertyCost) {
                      setDownPayment(newValue);
                    } else if (newValue > totalPropertyCost) {
                      alert('Down Payment cannot exceed Total Property Cost.');
                    }
                  }}
                />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Rent (₹)</Label>
                  <Input 
                    type="text" 
                    value={formatNumberInput(monthlyRent)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, ''); // Remove commas
                      if (/^\d*$/.test(rawValue)) { // Ensure numeric input
                        const parsedValue = parseInt(rawValue, 10);
                        if (!isNaN(parsedValue) && parsedValue >= 0) { // Allow zero as valid input
                          setMonthlyRent(parsedValue);
                        } else {
                          setMonthlyRent(''); // Handle empty input
                        }
                      } else {
                        alert('Please enter numeric values only.');
                      }
                    }}
                  />

                </div>
                <div className="space-y-2">
                  <Label>Monthly Maintenance (₹)</Label>
                  <Input 
                    type="text" 
                    value={formatNumberInput(maintenanceCharges)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, ''); // Remove commas
                      if (/^\d*$/.test(rawValue)) { // Ensure numeric input
                        const parsedValue = parseInt(rawValue, 10);
                        if (!isNaN(parsedValue) && parsedValue >= 0) { // Allow zero as valid input
                          setMaintenanceCharges(parsedValue);
                        } else {
                          setMaintenanceCharges(''); // Handle empty input
                        }
                      } else {
                        alert('Please enter numeric values only.');
                      }
                    }}
                  />

                </div>
                <div className="space-y-2">
                  <Label>Annual Appreciation (%)</Label>
                  <Input 
                    type="number" 
                    value={annualAppreciation}
                    onChange={(e) => setAnnualAppreciation(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Holding Period (Years)</Label>
                  <Input 
                    type="number" 
                    value={holdingPeriod}
                    onChange={(e) => setHoldingPeriod(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Annual Income (₹)</Label>
                  <Input 
                    type="text" 
                    value={formatNumberInput(totalIncome)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/,/g, ''); // Remove commas
                      if (/^\d*$/.test(rawValue)) { // Ensure numeric input
                        const parsedValue = parseInt(rawValue, 10);
                        if (!isNaN(parsedValue) && parsedValue >= 0) { // Allow zero as valid input
                          setTotalIncome(parsedValue);
                        } else {
                          setTotalIncome(''); // Handle empty input
                        }
                      } else {
                        alert('Please enter numeric values only.');
                      }
                    }}
                  />

                </div>
              </div>

              <div className="mt-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Rental Analysis</h3>
                  <p>Rental Yield: {rentalYield.toFixed(2)}%</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold mb-2">Capital Gains Analysis</h3>
                  <Card className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Purchase Value</p>
                        <p className="font-medium">₹{totalPropertyCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expected Future Value</p>
                        <p className="font-medium">₹{calculateAppreciationValue().toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Gain</p>
                        <p className="font-medium">₹{(calculateAppreciationValue() - totalPropertyCost).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Holding Period</p>
                        <p className="font-medium">{holdingPeriod} years ({holdingPeriod > 2 ? 'LTCG' : 'STCG'})</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Tax Breakdown</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Base Tax Rate</p>
                        <p className="font-medium">{holdingPeriod > 2 ? '20%' : '30%'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Base Tax Amount</p>
                        <p className="font-medium">₹{taxDetails.baseTax.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Surcharge</p>
                        <p className="font-medium">₹{taxDetails.surcharge.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Health & Education Cess</p>
                        <p className="font-medium">₹{taxDetails.cess.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Tax Amount</p>
                        <p className="font-medium">₹{taxDetails.total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Proceeds</p>
                        <p className="font-medium">₹{(calculateAppreciationValue() - taxDetails.total).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MortgageCalculator;
