pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/lifecycle/Pausable.sol";
import {IUpgrader} from "contracts/interface/IUpgrader.sol";
import {IDevProtocolAccess} from "contracts/interface/IDevProtocolAccess.sol";
import {IPatch} from "contracts/interface/IPatch.sol";
import {IUsingStorage} from "contracts/interface/IUsingStorage.sol";
import {IAddressConfig} from "contracts/interface/IAddressConfig.sol";
import {ILockup} from "contracts/interface/ILockup.sol";

contract PatchBase is Pausable, IPatch {
	address public upgrader;
	address public config;

	constructor(address _upgrader) public {
		upgrader = _upgrader;
		addPauser(upgrader);
	}

	modifier onlyUpgrader() {
		require(msg.sender == upgrader, "illegal access");
		_;
	}

	function setConfigAddress(address _config)
		external
		onlyUpgrader
		whenNotPaused
	{
		config = _config;
	}

	function afterRun() external onlyUpgrader whenNotPaused {
		Ownable(config).transferOwnership(upgrader);
	}

	function afterDeployAllocator(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address tmp = addressConfig.allocator();
		addressConfig.setAllocator(_next);
		IUpgrader(upgrader).addUpgradeEvent("Allocator", tmp, _next);
	}

	function afterDeployMarketFactory(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address tmp = addressConfig.marketFactory();
		addressConfig.setMarketFactory(_next);
		IUpgrader(upgrader).addUpgradeEvent("MarketFactory", tmp, _next);
	}

	function afterDeployMetricsFactory(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address tmp = addressConfig.metricsFactory();
		addressConfig.setMetricsFactory(_next);
		IUpgrader(upgrader).addUpgradeEvent("MetricsFactory", tmp, _next);
	}

	function afterDeployPropertyFactory(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address tmp = addressConfig.propertyFactory();
		addressConfig.setPropertyFactory(_next);
		IUpgrader(upgrader).addUpgradeEvent("PropertyFactory", tmp, _next);
	}

	function afterDeployWithdraw(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.withdraw();
		afterDeployUsingStorage(current, _next);
		addressConfig.setWithdraw(_next);
		IUpgrader(upgrader).addUpgradeEvent("Withdraw", current, _next);
	}

	function afterDeployVoteCounter(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.voteCounter();
		afterDeployUsingStorage(current, _next);
		addressConfig.setVoteCounter(_next);
		IUpgrader(upgrader).addUpgradeEvent("VoteCounter", current, _next);
	}

	function afterDeployPropertyGroup(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.propertyGroup();
		afterDeployUsingStorage(current, _next);
		addressConfig.setPropertyGroup(_next);
		IUpgrader(upgrader).addUpgradeEvent("PropertyGroup", current, _next);
	}

	function afterDeployPolicyGroup(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.policyGroup();
		afterDeployUsingStorage(current, _next);
		addressConfig.setPolicyGroup(_next);
		IUpgrader(upgrader).addUpgradeEvent("PolicyGroup", current, _next);
	}

	function afterDeployPolicyFactory(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.policyFactory();
		Ownable(_next).transferOwnership(upgrader);
		addressConfig.setPolicyFactory(_next);
		IUpgrader(upgrader).addUpgradeEvent("PolicyFactory", current, _next);
	}

	function afterDeployMetricsGroup(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.metricsGroup();
		afterDeployUsingStorage(current, _next);
		addressConfig.setMetricsGroup(_next);
		IUpgrader(upgrader).addUpgradeEvent("MetricsGroup", current, _next);
	}

	function afterDeployMarketGroup(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.marketGroup();
		afterDeployUsingStorage(current, _next);
		addressConfig.setMarketGroup(_next);
		IUpgrader(upgrader).addUpgradeEvent("MarketGroup", current, _next);
	}

	function afterDeployLockup(address _next) internal {
		IAddressConfig addressConfig = IAddressConfig(config);
		address current = addressConfig.lockup();
		afterDeployUsingStorage(current, _next);
		addressConfig.setLockup(_next);
		IUpgrader(upgrader).addUpgradeEvent("Lockup", current, _next);
	}

	function getDevMinter() internal view returns (address) {
		address lockup = IAddressConfig(config).lockup();
		return ILockup(lockup).devMinter();
	}

	function afterDeployUsingStorage(address _current, address _next) private {
		IDevProtocolAccess(upgrader).transferOwnership(_current, address(this));
		changeStorageOwner(_current, _next);
		Ownable(_current).transferOwnership(upgrader);
		Ownable(_next).transferOwnership(upgrader);
	}

	function changeStorageOwner(address _current, address _next) private {
		IUsingStorage current = IUsingStorage(_current);
		IUsingStorage next = IUsingStorage(_next);
		address storageAddress = current.getStorageAddress();
		next.setStorage(storageAddress);
		current.changeOwner(_next);
	}

	function run() external;
}
