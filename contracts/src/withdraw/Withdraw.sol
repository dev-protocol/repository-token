pragma solidity 0.5.17;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
// prettier-ignore
import {ERC20Mintable} from "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import {Decimals} from "contracts/src/common/libs/Decimals.sol";
import {UsingConfig} from "contracts/src/common/config/UsingConfig.sol";
import {WithdrawStorage} from "contracts/src/withdraw/WithdrawStorage.sol";
import {IWithdraw} from "contracts/interface/IWithdraw.sol";
import {ILockup} from "contracts/interface/ILockup.sol";
import {IMetricsGroup} from "contracts/interface/IMetricsGroup.sol";
import {IPropertyGroup} from "contracts/interface/IPropertyGroup.sol";

/**
 * A contract that manages the withdrawal of holder rewards for Property holders.
 */
contract Withdraw is IWithdraw, UsingConfig, WithdrawStorage {
	using SafeMath for uint256;
	using Decimals for uint256;
	event PropertyTransfer(address _property, address _from, address _to);

	/**
	 * Initialize the passed address as AddressConfig address.
	 */
	constructor(address _config) public UsingConfig(_config) {}

	/**
	 * Withdraws rewards.
	 */
	function withdraw(address _property) external {
		/**
		 * Validate
		 * the passed Property address is included the Property address set.
		 */
		require(
			IPropertyGroup(config().propertyGroup()).isGroup(_property),
			"this is illegal address"
		);

		/**
		 * Gets the withdrawable rewards amount and the latest cumulative sum of the maximum mint amount.
		 */
		(uint256 value, uint256 lastPrice) =
			_calculateWithdrawableAmount(_property, msg.sender);

		/**
		 * Validates the result is not 0.
		 */
		require(value != 0, "withdraw value is 0");
		/**
		 * save data to storage
		 */
		setWithdrawDStorage(_property, msg.sender, value, lastPrice);

		/**
		 * Mints the holder reward.
		 */
		ERC20Mintable erc20 = ERC20Mintable(config().token());
		require(erc20.mint(msg.sender, value), "dev mint failed");

		/**
		 * Since the total supply of tokens has changed, updates the latest maximum mint amount.
		 */
		ILockup lockup = ILockup(config().lockup());
		lockup.update();
	}

	/**
	 * save data to storage
	 */
	function setWithdrawDStorage(
		address _property,
		address _sender,
		uint256 _value,
		uint256 _lastPrice
	) private {
		/**
		 * Saves the latest cumulative sum of the holder reward price.
		 * By subtracting this value when calculating the next rewards, always withdrawal the difference from the previous time.
		 */
		setStorageLastWithdrawnReward(_property, _sender, _lastPrice);

		/**
		 * Sets the number of unwithdrawn rewards to 0.
		 */
		setPendingWithdrawal(_property, _sender, 0);

		/**
		 * Updates the withdrawal status to avoid double withdrawal for before DIP4.
		 */
		__updateLegacyWithdrawableAmount(_property, _sender);

		/**
		 * Adds the reward amount already withdrawn in the passed Property.
		 */
		setRewardsAmount(_property, getRewardsAmount(_property).add(_value));
	}

	/**
	 * Withdraws rewards.
	 */
	function bulkWithdraw(address[] calldata _properties)
		external
		returns (uint256)
	{
		validateProperties(_properties);
		uint256 mintValue;
		for (uint256 i = 0; i < _properties.length; i++) {
			/**
			 * Gets the withdrawable rewards amount and the latest cumulative sum of the maximum mint amount.
			 */
			(uint256 value, uint256 lastPrice) =
				_calculateWithdrawableAmount(_properties[i], msg.sender);
			if (value == 0) {
				continue;
			}
			mintValue = mintValue.add(value);
			/**
			 * save data to storage
			 */
			setWithdrawDStorage(_properties[i], msg.sender, value, lastPrice);
		}
		/**
		 * Mints the holder reward.
		 */
		ERC20Mintable erc20 = ERC20Mintable(config().token());
		if (mintValue != 0) {
			require(erc20.mint(msg.sender, mintValue), "dev mint failed");
		}
		/**
		 * Since the total supply of tokens has changed, updates the latest maximum mint amount.
		 */
		ILockup lockup = ILockup(config().lockup());
		lockup.update();
		return mintValue;
	}

	/**
	 * check data
	 */
	function validateProperties(address[] memory _properties) private view {
		require(_properties.length != 0, "length is 0");
		require(_properties.length <= 9, "length is too long");

		IPropertyGroup propertyGroup = IPropertyGroup(config().propertyGroup());
		for (uint256 i = 0; i < _properties.length; i++) {
			require(
				propertyGroup.isGroup(_properties[i]),
				"this is illegal address"
			);
			for (uint256 k = i + 1; k < _properties.length; k++) {
				require(_properties[i] != _properties[k], "duplicate address");
			}
		}
	}

	/**
	 * Updates the change in compensation amount due to the change in the ownership ratio of the passed Property.
	 * When the ownership ratio of Property changes, the reward that the Property holder can withdraw will change.
	 * It is necessary to update the status before and after the ownership ratio changes.
	 */
	function beforeBalanceChange(
		address _property,
		address _from,
		address _to
	) external {
		/**
		 * Validates the sender is Allocator contract.
		 */
		require(msg.sender == config().allocator(), "this is illegal address");

		/**
		 * Gets the cumulative sum of the transfer source's "before transfer" withdrawable reward amount and the cumulative sum of the maximum mint amount.
		 */
		(uint256 amountFrom, uint256 priceFrom) =
			_calculateAmount(_property, _from);

		/**
		 * Gets the cumulative sum of the transfer destination's "before receive" withdrawable reward amount and the cumulative sum of the maximum mint amount.
		 */
		(uint256 amountTo, uint256 priceTo) = _calculateAmount(_property, _to);

		/**
		 * Updates the last cumulative sum of the maximum mint amount of the transfer source and destination.
		 */
		setStorageLastWithdrawnReward(_property, _from, priceFrom);
		setStorageLastWithdrawnReward(_property, _to, priceTo);

		/**
		 * Gets the unwithdrawn reward amount of the transfer source and destination.
		 */
		uint256 pendFrom = getPendingWithdrawal(_property, _from);
		uint256 pendTo = getPendingWithdrawal(_property, _to);

		/**
		 * Adds the undrawn reward amount of the transfer source and destination.
		 */
		setPendingWithdrawal(_property, _from, pendFrom.add(amountFrom));
		setPendingWithdrawal(_property, _to, pendTo.add(amountTo));

		emit PropertyTransfer(_property, _from, _to);
	}

	/**
	 * Returns the holder reward.
	 */
	function _calculateAmount(address _property, address _user)
		private
		view
		returns (uint256 _amount, uint256 _price)
	{
		ILockup lockup = ILockup(config().lockup());
		ERC20Mintable property = ERC20Mintable(_property);

		/**
		 * Gets the latest cumulative sum of the holder reward.
		 */
		uint256 reward =
			lockup.calculateCumulativeHoldersRewardAmount(_property);

		/**
		 * Gets the cumulative sum of the holder reward price recorded the last time you withdrew.
		 */
		uint256 _lastReward = getStorageLastWithdrawnReward(_property, _user);

		uint256 balance = property.balanceOf(_user);
		uint256 totalSupply = property.totalSupply();
		uint256 unitPrice = reward.sub(_lastReward).mulBasis().div(totalSupply);

		uint256 value = unitPrice.mul(balance).divBasis().divBasis();

		/**
		 * Returns the result after adjusted decimals to 10^18, and the latest cumulative sum of the holder reward price.
		 */
		return (value, reward);
	}

	/**
	 * Returns the total rewards currently available for withdrawal. (For calling from inside the contract)
	 */
	function _calculateWithdrawableAmount(address _property, address _user)
		private
		view
		returns (uint256 _amount, uint256 _price)
	{
		/**
		 * Gets the latest withdrawal reward amount.
		 */
		(uint256 _value, uint256 price) = _calculateAmount(_property, _user);

		/**
		 * If the passed Property has not authenticated, returns always 0.
		 */
		if (
			IMetricsGroup(config().metricsGroup()).hasAssets(_property) == false
		) {
			return (0, price);
		}

		/**
		 * Gets the reward amount of before DIP4.
		 */
		uint256 legacy = __legacyWithdrawableAmount(_property, _user);

		/**
		 * Gets the reward amount in saved without withdrawal and returns the sum of all values.
		 */
		uint256 value =
			_value.add(getPendingWithdrawal(_property, _user)).add(legacy);
		return (value, price);
	}

	/**
	 * Returns the total rewards currently available for withdrawal. (For calling from external of the contract)
	 */
	function calculateWithdrawableAmount(address _property, address _user)
		external
		view
		returns (uint256)
	{
		(uint256 value, ) = _calculateWithdrawableAmount(_property, _user);
		return value;
	}

	/**
	 * Returns the reward amount of the calculation model before DIP4.
	 * It can be calculated by subtracting "the last cumulative sum of reward unit price" from
	 * "the current cumulative sum of reward unit price," and multiplying by the balance of the user.
	 */
	function __legacyWithdrawableAmount(address _property, address _user)
		private
		view
		returns (uint256)
	{
		uint256 _last = getLastWithdrawalPrice(_property, _user);
		uint256 price = getCumulativePrice(_property);
		uint256 priceGap = price.sub(_last);
		uint256 balance = ERC20Mintable(_property).balanceOf(_user);
		uint256 value = priceGap.mul(balance);
		return value.divBasis();
	}

	/**
	 * Updates and treats the reward of before DIP4 as already received.
	 */
	function __updateLegacyWithdrawableAmount(address _property, address _user)
		private
	{
		uint256 price = getCumulativePrice(_property);
		setLastWithdrawalPrice(_property, _user, price);
	}
}
