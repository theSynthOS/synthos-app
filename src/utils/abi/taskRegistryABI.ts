export const taskRegistryAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "uuid", type: "string" },
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
    ],
    name: "TaskRegistered",
    type: "event",
  },
  {
    inputs: [{ internalType: "string", name: "uuid", type: "string" }],
    name: "getTask",
    outputs: [
      {
        components: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct TaskRegistry.Task",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "uuid", type: "string" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "callData", type: "bytes" },
    ],
    name: "registerTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "", type: "string" }],
    name: "tasks",
    outputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "callData", type: "bytes" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
