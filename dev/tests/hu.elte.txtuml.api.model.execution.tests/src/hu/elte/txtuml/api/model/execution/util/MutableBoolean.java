package hu.elte.txtuml.api.model.execution.util;

public class MutableBoolean {

	public volatile boolean value;

	public MutableBoolean() {
		this(false);
	}

	public MutableBoolean(boolean value) {
		this.value = value;
	}

}
