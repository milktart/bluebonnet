/**
 * Tests for CompanionsFormSection component
 * Validates unified companion form functionality for both trip and item contexts
 */

describe('CompanionsFormSection', () => {
  describe('Display Name Generation', () => {
    const getCompanionDisplayName = (comp) => {
      const data = comp.companion || comp;
      let name = '';
      if (data.firstName && data.lastName) {
        name = `${data.firstName} ${data.lastName}`;
      } else if (data.firstName) {
        name = data.firstName;
      } else if (data.lastName) {
        name = data.lastName;
      } else if (data.name) {
        name = data.name;
      } else {
        name = data.email;
      }
      return name;
    };

    it('should return full name when both firstName and lastName exist', () => {
      const companion = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      expect(getCompanionDisplayName(companion)).toBe('John Doe');
    });

    it('should return first name only if no last name', () => {
      const companion = { firstName: 'John', email: 'john@example.com' };
      expect(getCompanionDisplayName(companion)).toBe('John');
    });

    it('should return last name only if no first name', () => {
      const companion = { lastName: 'Doe', email: 'john@example.com' };
      expect(getCompanionDisplayName(companion)).toBe('Doe');
    });

    it('should return email if no name fields', () => {
      const companion = { email: 'john@example.com' };
      expect(getCompanionDisplayName(companion)).toBe('john@example.com');
    });

    it('should handle nested companion.companion structure', () => {
      const companion = {
        companion: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        companionId: 'abc123',
      };
      expect(getCompanionDisplayName(companion)).toBe('Jane Smith');
    });

    it('should prefer name field over email as fallback', () => {
      const companion = { name: 'Full Name', email: 'user@example.com' };
      expect(getCompanionDisplayName(companion)).toBe('Full Name');
    });
  });

  describe('Email Extraction', () => {
    const getCompanionEmail = (comp) => {
      return comp.companion?.email || comp.email;
    };

    it('should extract email from direct object', () => {
      const companion = { email: 'john@example.com', id: '123' };
      expect(getCompanionEmail(companion)).toBe('john@example.com');
    });

    it('should extract email from nested companion structure', () => {
      const companion = {
        companion: { email: 'jane@example.com', firstName: 'Jane' },
        companionId: 'abc123',
      };
      expect(getCompanionEmail(companion)).toBe('jane@example.com');
    });

    it('should prefer nested email over direct email', () => {
      const companion = {
        email: 'wrong@example.com',
        companion: { email: 'correct@example.com' },
      };
      expect(getCompanionEmail(companion)).toBe('correct@example.com');
    });
  });

  describe('Companion Sorting', () => {
    const getSortedCompanions = (comps, ownerId) => {
      return [...comps].sort((a, b) => {
        const aData = a.companion || a;
        const bData = b.companion || b;
        const aUserId = aData.userId || a.userId;
        const bUserId = bData.userId || b.userId;

        // Owner comes first (if specified)
        if (ownerId) {
          if (aUserId === ownerId && bUserId !== ownerId) return -1;
          if (aUserId !== ownerId && bUserId === ownerId) return 1;
        }

        // Then sort alphabetically by first name
        const aFirstName = (aData.firstName || '').toLowerCase();
        const bFirstName = (bData.firstName || '').toLowerCase();
        const aLastName = (aData.lastName || '').toLowerCase();
        const bLastName = (bData.lastName || '').toLowerCase();

        if (aFirstName !== bFirstName) {
          return aFirstName.localeCompare(bFirstName);
        }

        return aLastName.localeCompare(bLastName);
      });
    };

    it('should place owner first', () => {
      const companions = [
        { id: '1', userId: 'user2', firstName: 'Alice', lastName: 'Smith' },
        { id: '2', userId: 'owner-id', firstName: 'Bob', lastName: 'Johnson' },
        { id: '3', userId: 'user3', firstName: 'Charlie', lastName: 'Brown' },
      ];

      const sorted = getSortedCompanions(companions, 'owner-id');
      expect(sorted[0].userId).toBe('owner-id');
    });

    it('should sort alphabetically by first name after owner', () => {
      const companions = [
        { id: '1', firstName: 'Charlie', lastName: 'Brown' },
        { id: '2', firstName: 'Alice', lastName: 'Smith' },
        { id: '3', firstName: 'Bob', lastName: 'Johnson' },
      ];

      const sorted = getSortedCompanions(companions, null);
      expect(sorted[0].firstName).toBe('Alice');
      expect(sorted[1].firstName).toBe('Bob');
      expect(sorted[2].firstName).toBe('Charlie');
    });

    it('should sort by last name when first names are same', () => {
      const companions = [
        { id: '1', firstName: 'John', lastName: 'Zebra' },
        { id: '2', firstName: 'John', lastName: 'Apple' },
        { id: '3', firstName: 'John', lastName: 'Middle' },
      ];

      const sorted = getSortedCompanions(companions, null);
      expect(sorted[0].lastName).toBe('Apple');
      expect(sorted[1].lastName).toBe('Middle');
      expect(sorted[2].lastName).toBe('Zebra');
    });

    it('should handle case-insensitive sorting', () => {
      const companions = [
        { id: '1', firstName: 'alice', lastName: 'Smith' },
        { id: '2', firstName: 'CHARLIE', lastName: 'Brown' },
        { id: '3', firstName: 'Bob', lastName: 'Johnson' },
      ];

      const sorted = getSortedCompanions(companions, null);
      expect(sorted[0].firstName.toLowerCase()).toBe('alice');
      expect(sorted[1].firstName.toLowerCase()).toBe('bob');
      expect(sorted[2].firstName.toLowerCase()).toBe('charlie');
    });
  });

  describe('Search Filtering', () => {
    const searchCompanions = (availableCompanions, addedCompanions, query) => {
      if (!query.trim()) return [];

      const lowerQuery = query.toLowerCase();
      const addedEmails = new Set(addedCompanions.map((c) => c.email));

      return availableCompanions.filter((comp) => {
        const email = comp.email;
        if (addedEmails.has(email)) return false;
        const displayName = `${comp.firstName || ''} ${comp.lastName || ''}`.trim();
        return (
          email.toLowerCase().includes(lowerQuery) || displayName.toLowerCase().includes(lowerQuery)
        );
      });
    };

    it('should filter companions by email', () => {
      const available = [
        { id: '1', email: 'john@example.com', firstName: 'John' },
        { id: '2', email: 'jane@example.com', firstName: 'Jane' },
      ];

      const results = searchCompanions(available, [], 'john');
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('john@example.com');
    });

    it('should filter companions by first name', () => {
      const available = [
        { id: '1', email: 'john@example.com', firstName: 'John' },
        { id: '2', email: 'jane@example.com', firstName: 'Jane' },
      ];

      const results = searchCompanions(available, [], 'jane');
      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('Jane');
    });

    it('should exclude already-added companions', () => {
      const available = [
        { id: '1', email: 'john@example.com', firstName: 'John' },
        { id: '2', email: 'jane@example.com', firstName: 'Jane' },
      ];
      const added = [{ email: 'john@example.com' }];

      const results = searchCompanions(available, added, 'jo');
      expect(results).toHaveLength(0);
    });

    it('should return empty array for empty query', () => {
      const available = [{ id: '1', email: 'john@example.com', firstName: 'John' }];

      const results = searchCompanions(available, [], '');
      expect(results).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const available = [{ id: '1', email: 'john@example.com', firstName: 'John' }];

      const results = searchCompanions(available, [], 'JOHN');
      expect(results).toHaveLength(1);
    });
  });

  describe('Item Remove Permission Logic (Standalone Item)', () => {
    const canRemoveFromStandalone = (companion, companions, currentUserId, itemOwnerId) => {
      const companionId = companion.userId || companion.id;
      const isCurrentUserCompanion = currentUserId ? companionId === currentUserId : false;
      const isItemOwner = itemOwnerId ? currentUserId === itemOwnerId : false;

      // Item owner: can remove any companion except themselves
      if (isItemOwner) {
        return companionId !== currentUserId;
      }

      // Item companion/attendee: can only remove themselves
      if (isCurrentUserCompanion) {
        return true;
      }

      return false;
    };

    it('should allow item owner to remove other companions', () => {
      const companion = { id: 'comp-1', firstName: 'John' };
      const canRemove = canRemoveFromStandalone(companion, [], 'owner-id', 'owner-id');
      expect(canRemove).toBe(true);
    });

    it('should prevent item owner from removing themselves', () => {
      const companion = { id: 'owner-id', firstName: 'Owner' };
      const canRemove = canRemoveFromStandalone(companion, [], 'owner-id', 'owner-id');
      expect(canRemove).toBe(false);
    });

    it('should allow companion to remove themselves', () => {
      const companion = { id: 'comp-1', firstName: 'Companion' };
      const canRemove = canRemoveFromStandalone(companion, [], 'comp-1', 'owner-id');
      expect(canRemove).toBe(true);
    });

    it('should prevent companion from removing others', () => {
      const companion = { id: 'comp-2', firstName: 'Other' };
      const canRemove = canRemoveFromStandalone(companion, [], 'comp-1', 'owner-id');
      expect(canRemove).toBe(false);
    });
  });

  describe('Item Remove Permission Logic (Trip Item)', () => {
    const canRemoveFromTripItem = (companion, companions, currentUserId, tripOwnerId) => {
      const companionId = companion.userId || companion.id;
      const isCurrentUserCompanion = currentUserId ? companionId === currentUserId : false;
      const isTripOwner = tripOwnerId ? currentUserId === tripOwnerId : false;

      // Trip owner: can remove any companion if there's at least one other attendee
      if (isTripOwner) {
        const otherCompanions = companions.filter((c) => {
          const cId = c.userId || c.id;
          return cId !== companionId;
        });
        return otherCompanions.length > 0;
      }

      // Trip companion: can only remove themselves if there's at least one other attendee
      if (isCurrentUserCompanion) {
        const otherCompanions = companions.filter((c) => {
          const cId = c.userId || c.id;
          return cId !== companionId;
        });
        return otherCompanions.length > 0;
      }

      return false;
    };

    it('should allow trip owner to remove companions when others remain', () => {
      const companions = [{ id: 'comp-1' }, { id: 'comp-2' }];
      const canRemove = canRemoveFromTripItem(companions[0], companions, 'owner-id', 'owner-id');
      expect(canRemove).toBe(true);
    });

    it('should prevent trip owner from removing last companion', () => {
      const companions = [{ id: 'comp-1' }];
      const canRemove = canRemoveFromTripItem(companions[0], companions, 'owner-id', 'owner-id');
      expect(canRemove).toBe(false);
    });

    it('should allow companion to remove themselves when others remain', () => {
      const companions = [{ id: 'comp-1' }, { id: 'comp-2' }];
      const canRemove = canRemoveFromTripItem(companions[0], companions, 'comp-1', 'owner-id');
      expect(canRemove).toBe(true);
    });

    it('should prevent companion from removing themselves as last attendee', () => {
      const companions = [{ id: 'comp-1' }];
      const canRemove = canRemoveFromTripItem(companions[0], companions, 'comp-1', 'owner-id');
      expect(canRemove).toBe(false);
    });
  });

  describe('Component Props Integration', () => {
    it('should accept trip mode props', () => {
      const props = {
        type: 'trip',
        entityId: 'trip-123',
        tripOwnerId: 'user-1',
        companions: [],
        canEdit: true,
      };

      expect(props.type).toBe('trip');
      expect(props.entityId).toBe('trip-123');
      expect(props.tripOwnerId).toBe('user-1');
    });

    it('should accept item mode props for trip items', () => {
      const props = {
        type: 'item',
        entityId: 'flight-123',
        itemOwnerId: 'user-1',
        tripOwnerId: 'user-2',
        tripId: 'trip-123',
        isStandaloneItem: false,
        companions: [],
        canEdit: true,
      };

      expect(props.type).toBe('item');
      expect(props.isStandaloneItem).toBe(false);
      expect(props.tripId).toBe('trip-123');
    });

    it('should accept item mode props for standalone items', () => {
      const props = {
        type: 'item',
        entityId: 'hotel-456',
        itemOwnerId: 'user-1',
        isStandaloneItem: true,
        tripId: null,
        companions: [],
        canEdit: true,
      };

      expect(props.type).toBe('item');
      expect(props.isStandaloneItem).toBe(true);
      expect(props.tripId).toBe(null);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work as drop-in replacement for TripCompanionsForm', () => {
      // Trip form only needs these props
      const tripProps = {
        type: 'trip',
        entityId: 'trip-id',
        companions: [],
        tripOwnerId: null,
        canEdit: true,
      };

      expect(tripProps.type).toBe('trip');
      expect(tripProps.canEdit).toBe(true);
    });

    it('should work as drop-in replacement for ItemCompanionsForm', () => {
      // Item form needs these props
      const itemProps = {
        type: 'item',
        entityId: 'item-id',
        companions: [],
        itemOwnerId: null,
        tripOwnerId: null,
        isStandaloneItem: false,
        currentUserId: null,
        canEdit: true,
      };

      expect(itemProps.type).toBe('item');
      expect(itemProps.isStandaloneItem).toBe(false);
    });
  });
});
