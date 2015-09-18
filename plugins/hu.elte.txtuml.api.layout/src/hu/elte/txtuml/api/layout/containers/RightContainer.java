package hu.elte.txtuml.api.layout.containers;

import hu.elte.txtuml.api.layout.Right;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The container for repeatable annotation {@link Right}.
 * 
 * @author Gabor Ferenc Kovacs
 *
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface RightContainer {
	Right[] value() default {};
}