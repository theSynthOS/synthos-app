export const taskRegistryAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "uuid", type: "bytes32" },
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
    ],
    name: "TaskRegistered",
    type: "event",
  },
  {
    inputs: [{ internalType: "bytes32", name: "uuid", type: "bytes32" }],
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
      { internalType: "bytes32", name: "uuid", type: "bytes32" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "bytes", name: "callData", type: "bytes" },
    ],
    name: "registerTask",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
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
