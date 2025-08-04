const Holding = require('../Models/HoldingModel');
module.exports.getHoldings = async (req, res) => {
    try {
        const { HoldingId } = req.params;
        
        if (!HoldingId) {
            return res.status(400).json({
                message: "HoldingId is required",
                status: 400
            });
        }
        
        const userHolding = await Holding.findOne({ HoldingId });
        
        if (!userHolding) {
            return res.status(404).json({
                message: "No holdings found for this user",
                status: 404
            });
        }
        
        return res.status(200).json({
            message: "Holdings retrieved successfully",
            status: 200,
            holdings: userHolding.Holdings
        });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ 
            message: err.message,
            status: 500 
        });
    }
};

// module.exports.addHolding = async (req, res) => {
//     try {
//         const { HoldingId, Name, Symbol, Quantity, Price } = req.body;

//         if (!HoldingId || !Name || !Symbol || !Quantity || !Price) {
//             return res.status(400).json({
//                 message: "Please enter all fields",
//                 status: 400
//             });
//         }

//         let userHolding = await Holding.findOne({ HoldingId });

//         if (!userHolding) {
//             // Create new holding document if none exists
//             userHolding = new Holding({
//                 HoldingId,
//                 Holdings: [{
//                     Name,
//                     Symbol,
//                     Quantity,
//                     Price
//                 }]
//             });
            
//             await userHolding.save();
            
//             return res.status(201).json({
//                 message: "Holding created successfully",
//                 status: 201,
//                 holding: userHolding
//             });
//         }
        
//         // Check if the symbol already exists in holdings
//         const existingHoldingIndex = userHolding.Holdings.findIndex(
//             holding => holding.Symbol === Symbol
//         );
        
//         if (existingHoldingIndex !== -1) {
//             // Update existing holding
//             userHolding.Holdings[existingHoldingIndex].Quantity += Number(Quantity);
//             // Could implement average price calculation here if needed
//             userHolding.Holdings[existingHoldingIndex].Price = Price;
//             userHolding.Holdings[existingHoldingIndex].Date = Date.now();
//         } else {
//             // Add new holding
//             userHolding.Holdings.push({
//                 Name,
//                 Symbol,
//                 Quantity,
//                 Price
//             });
//         }
        
//         await userHolding.save();
        
//         return res.status(200).json({
//             message: "Holding added successfully",
//             status: 200,
//             holding: userHolding
//         });
        
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ 
//             message: err.message,
//             status: 500 
//         });
//     }
// };

// module.exports.removeHolding = async (req, res) => {
//     try {
//         const { HoldingId,Symbol } = req.body;
        
//         if (!Symbol) {
//             return res.status(400).json({
//                 message: "Symbol is required",
//                 status: 400
//             });
//         }
        
//         const userHolding = await Holding.findOne({ HoldingId});
        
//         if (!userHolding) {
//             return res.status(404).json({
//                 message: "No holdings found for this user",
//                 status: 404
//             });
//         }
        
//         // Check if the symbol exists in holdings
//         const existingHoldingIndex = userHolding.Holdings.findIndex(
//             holding => holding.Symbol === Symbol
//         );
        
//         if (existingHoldingIndex === -1) {
//             return res.status(404).json({
//                 message: "Symbol not found in holdings",
//                 status: 404
//             });
//         }
        
//         // Remove the holding
//         userHolding.Holdings.splice(existingHoldingIndex, 1);
        
//         await userHolding.save();
        
//         return res.status(200).json({
//             message: "Holding removed successfully",
//             status: 200,
//             holding: userHolding
//         });
        
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ 
//             message: err.message,
//             status: 500 
//         });
//     }
// };