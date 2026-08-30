/**
 * Clinical Hematology & Transfusion Service Engine.
 * Manages blood group compatibility verification, ABO/Rh crossmatching,
 * emergency blood unit reservation, and transfusion safety protocols.
 */

const ClinicalHematology = require('../models/ClinicalHematologyModel');

const ABO_COMPATIBILITY_MATRIX = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

class ClinicalHematologyService {
  /**
   * Validates if a donor blood group is compatible with recipient blood group.
   */
  static isBloodGroupCompatible(donorGroup, recipientGroup) {
    const allowedDonors = ABO_COMPATIBILITY_MATRIX[recipientGroup] || [];
    return allowedDonors.includes(donorGroup);
  }

  /**
   * Creates a new hematology transfusion crossmatch order.
   */
  static async createTransfusionOrder(orderData) {
    const newOrder = new ClinicalHematology({
      orderId: `HEM-ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      ...orderData,
      crossmatchStatus: 'PENDING',
    });
    return await newOrder.save();
  }

  /**
   * Crossmatches available donor blood units against patient transfusion order.
   */
  static async performCrossmatch(orderId, availableBloodUnits) {
    const order = await ClinicalHematology.findOne({ orderId });
    if (!order) {
      throw new Error(`Transfusion order ${orderId} not found.`);
    }

    const compatibleUnits = [];
    for (const unit of availableBloodUnits) {
      if (
        unit.status === 'AVAILABLE' &&
        this.isBloodGroupCompatible(unit.bloodGroup, order.recipientBloodGroup)
      ) {
        unit.status = 'CROSSMATCHED';
        unit.assignedPatientId = order.patientId;
        unit.isCrossmatched = true;
        compatibleUnits.push(unit);

        if (compatibleUnits.length >= order.requestedUnitsCount) break;
      }
    }

    if (compatibleUnits.length > 0) {
      order.assignedUnits = compatibleUnits;
      order.crossmatchStatus = 'COMPATIBLE';
    } else {
      order.crossmatchStatus = 'INCOMPATIBLE';
    }

    return await order.save();
  }

  /**
   * Finalizes transfusion disbursement audit log.
   */
  static async completeTransfusion(orderId) {
    const order = await ClinicalHematology.findOne({ orderId });
    if (!order) {
      throw new Error(`Transfusion order ${orderId} not found.`);
    }

    order.crossmatchStatus = 'TRANSFUSION_COMPLETED';
    order.assignedUnits.forEach((unit) => {
      unit.status = 'TRANSFUSED';
    });

    return await order.save();
  }
}

module.exports = ClinicalHematologyService;
